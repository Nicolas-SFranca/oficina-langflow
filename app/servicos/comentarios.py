"""Comentários, respostas, moderação e o simulador do instrutor."""

import random

from app.db import consultar, transacao
from app.erros import ErroAPI
from app.servicos import atividade
from app.servicos.formato import comentario
from app.servicos.pontuacao import pontos_ao_ocultar, pontos_da_resposta
from app.servicos.seed import TEXTOS, _autores, _tipo_comentario

_SELECT = """
    SELECT id, post_id, autor, texto, origem, oculto, resposta_de_id, criado_em
    FROM comentarios
"""


def arvore(post_id: int) -> list[dict]:
    linhas = consultar(
        f"{_SELECT} WHERE post_id = %s ORDER BY criado_em, id",
        (post_id,),
    )
    nos = {linha["id"]: comentario(linha) | {"respostas": []} for linha in linhas}
    raizes: list[dict] = []
    for linha in linhas:
        no = nos[linha["id"]]
        pai = linha["resposta_de_id"]
        if pai and pai in nos:
            nos[pai]["respostas"].append(no)
        else:
            raizes.append(no)
    return raizes


def _post_do_comentario(cursor, comentario_id: int) -> dict | None:
    cursor.execute(
        """
        SELECT comentarios.id, comentarios.oculto, posts.id AS post_id, posts.perfil_id,
               gabarito_comentarios.tipo
        FROM comentarios
        JOIN posts ON posts.id = comentarios.post_id
        LEFT JOIN gabarito_comentarios ON gabarito_comentarios.comentario_id = comentarios.id
        WHERE comentarios.id = %s
        """,
        (comentario_id,),
    )
    return cursor.fetchone()


def _garantir_post_do_grupo(cursor, post_id: int, grupo: dict) -> tuple[int, str] | None:
    cursor.execute("SELECT id, perfil_id FROM posts WHERE id = %s", (post_id,))
    alvo = cursor.fetchone()
    if alvo is None:
        return (404, "Post não encontrado")
    if alvo["perfil_id"] != grupo["perfil_id"]:
        return (403, "Esse post não é do seu perfil")
    return None


def listar_para_grupo(grupo: dict, post_id: int, apenas_sem_resposta: bool) -> list[dict]:
    with transacao() as cursor:
        erro = _garantir_post_do_grupo(cursor, post_id, grupo)
    if erro:
        raise ErroAPI(*erro)
    if not apenas_sem_resposta:
        return arvore(post_id)
    linhas = consultar(
        f"""
        {_SELECT}
        WHERE post_id = %s
          AND resposta_de_id IS NULL
          AND oculto = false
          AND NOT EXISTS (
              SELECT 1 FROM comentarios resposta WHERE resposta.resposta_de_id = comentarios.id
          )
        ORDER BY criado_em, id
        """,
        (post_id,),
    )
    return [comentario(linha) for linha in linhas]


def responder(grupo: dict, comentario_id: int, texto: str) -> dict:
    resposta = texto.strip()
    if not resposta:
        raise ErroAPI(400, "A resposta não pode ficar vazia")
    if len(resposta) > 500:
        raise ErroAPI(400, "A resposta passa de 500 caracteres")

    erro: tuple[int, str] | None = None
    criado: dict | None = None
    with transacao() as cursor:
        alvo = _post_do_comentario(cursor, comentario_id)
        parametros = {"comentario_id": comentario_id, "texto": resposta}
        if alvo is None:
            erro = (404, "Comentário não encontrado")
            atividade.registrar(
                cursor, grupo["id"], "responder_comentario", parametros, erro[1],
                f"{grupo['nome']} tentou responder um comentário", False, 0,
            )
        elif alvo["perfil_id"] != grupo["perfil_id"]:
            erro = (403, "Esse comentário não é de um post do seu perfil")
            atividade.registrar(
                cursor, grupo["id"], "responder_comentario", parametros, erro[1],
                f"{grupo['nome']} tentou responder um comentário de outro perfil", False, 0,
            )
        else:
            cursor.execute(
                """
                SELECT 1 FROM comentarios
                WHERE resposta_de_id = %s AND origem = 'agente'
                LIMIT 1
                """,
                (comentario_id,),
            )
            ja_pontuou = cursor.fetchone() is not None
            pontos = pontos_da_resposta(alvo["tipo"], ja_pontuou)
            cursor.execute(
                """
                INSERT INTO comentarios (post_id, autor, texto, origem, oculto, resposta_de_id)
                VALUES (%s, %s, %s, 'agente', false, %s)
                RETURNING id, post_id, autor, texto, origem, oculto, resposta_de_id, criado_em
                """,
                (alvo["post_id"], grupo.get("nome_perfil") or grupo["nome"], resposta, comentario_id),
            )
            criado = cursor.fetchone()
            atividade.registrar(
                cursor,
                grupo["id"],
                "responder_comentario",
                parametros,
                resposta,
                f"{grupo['nome']} respondeu um comentário",
                True,
                pontos,
            )
    if erro:
        raise ErroAPI(*erro)
    return comentario(criado)


def ocultar(grupo: dict, comentario_id: int, motivo: str) -> dict:
    texto_motivo = motivo.strip()
    if not texto_motivo:
        raise ErroAPI(400, "Informe o motivo")

    erro: tuple[int, str] | None = None
    pontos = 0
    with transacao() as cursor:
        alvo = _post_do_comentario(cursor, comentario_id)
        parametros = {"comentario_id": comentario_id, "motivo": texto_motivo}
        if alvo is None:
            erro = (404, "Comentário não encontrado")
            atividade.registrar(
                cursor, grupo["id"], "ocultar_comentario", parametros, erro[1],
                f"{grupo['nome']} tentou ocultar um comentário", False, 0,
            )
        elif alvo["perfil_id"] != grupo["perfil_id"]:
            erro = (403, "Esse comentário não é de um post do seu perfil")
            atividade.registrar(
                cursor, grupo["id"], "ocultar_comentario", parametros, erro[1],
                f"{grupo['nome']} tentou ocultar um comentário de outro perfil", False, 0,
            )
        elif alvo["oculto"]:
            erro = (409, "Comentário já está oculto")
            atividade.registrar(
                cursor, grupo["id"], "ocultar_comentario", parametros, erro[1],
                f"{grupo['nome']} tentou ocultar um comentário de novo", False, 0,
            )
        else:
            pontos = pontos_ao_ocultar(alvo["tipo"])
            cursor.execute("UPDATE comentarios SET oculto = true WHERE id = %s", (comentario_id,))
            atividade.registrar(
                cursor,
                grupo["id"],
                "ocultar_comentario",
                parametros,
                f"Pontos {pontos}",
                f"{grupo['nome']} ocultou um comentário",
                True,
                pontos,
            )
    if erro:
        raise ErroAPI(*erro)
    return {"ok": True, "pontos_ganhos": pontos}


def simular(quantidade: int) -> dict:
    """Cria comentários e curtidas falsos, de preferência nos posts recentes dos grupos."""
    posts = consultar(
        """
        SELECT posts.id
        FROM posts
        JOIN grupos ON grupos.perfil_id = posts.perfil_id
        ORDER BY posts.criado_em DESC
        LIMIT 40
        """
    )
    if not posts:
        raise ErroAPI(400, "Não há posts de perfis com grupo para simular")

    ids = [linha["id"] for linha in posts]
    pesos = list(range(len(ids), 0, -1))
    autores = _autores()
    escolhidos = random.choices(ids, weights=pesos, k=quantidade)
    with transacao() as cursor:
        for post_id in escolhidos:
            tipo = _tipo_comentario()
            cursor.execute(
                """
                INSERT INTO comentarios (post_id, autor, texto, origem, oculto)
                VALUES (%s, %s, %s, 'simulador', false)
                RETURNING id
                """,
                (post_id, random.choice(autores), random.choice(TEXTOS[tipo])),
            )
            cursor.execute(
                "INSERT INTO gabarito_comentarios (comentario_id, tipo) VALUES (%s, %s)",
                (cursor.fetchone()["id"], tipo),
            )
        curtidas = 0
        for post_id in random.choices(ids, weights=pesos, k=quantidade):
            cursor.execute(
                """
                INSERT INTO curtidas (post_id, autor, grupo_id)
                VALUES (%s, %s, NULL)
                ON CONFLICT (post_id, autor) DO NOTHING
                """,
                (post_id, random.choice(autores)),
            )
            curtidas += cursor.rowcount
    return {"comentarios": quantidade, "curtidas": curtidas}
