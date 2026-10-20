"""Feed, publicação e curtidas."""

import secrets

from app.db import consultar, consultar_um, transacao
from app.erros import ErroAPI
from app.servicos import atividade, limites
from app.servicos.formato import post
from app.servicos.pontuacao import PONTOS_CURTIDA_RECEBIDA, pontos_do_post

_SELECT = """
    SELECT posts.id, posts.legenda, posts.imagem_url, posts.hashtags, posts.origem, posts.criado_em,
           perfis.id AS perfil_id, perfis.handle, perfis.nome, perfis.avatar_url,
           (SELECT count(*) FROM curtidas WHERE curtidas.post_id = posts.id) AS curtidas,
           (SELECT count(*) FROM comentarios WHERE comentarios.post_id = posts.id) AS total_comentarios
    FROM posts
    JOIN perfis ON perfis.id = posts.perfil_id
"""


def listar_feed(limite: int, antes_de: int | None, handle: str | None) -> list[dict]:
    filtros: list[str] = []
    parametros: list = []
    if handle:
        filtros.append("perfis.handle = %s")
        parametros.append(handle)
    if antes_de is not None:
        filtros.append(
            """
            (posts.criado_em, posts.id) < (
                SELECT criado_em, id FROM posts WHERE id = %s
            )
            """
        )
        parametros.append(antes_de)
    onde = f"WHERE {' AND '.join(filtros)}" if filtros else ""
    parametros.append(limite)
    linhas = consultar(
        f"{_SELECT} {onde} ORDER BY posts.criado_em DESC, posts.id DESC LIMIT %s",
        tuple(parametros),
    )
    return [post(linha) for linha in linhas]


def listar_do_perfil(perfil_id: int, limite: int | None = None) -> list[dict]:
    if limite is None:
        linhas = consultar(
            f"{_SELECT} WHERE posts.perfil_id = %s ORDER BY posts.criado_em DESC, posts.id DESC",
            (perfil_id,),
        )
    else:
        linhas = consultar(
            f"{_SELECT} WHERE posts.perfil_id = %s ORDER BY posts.criado_em DESC, posts.id DESC LIMIT %s",
            (perfil_id, limite),
        )
    return [post(linha) for linha in linhas]


def obter(post_id: int) -> dict:
    from app.servicos.comentarios import arvore

    linha = consultar_um(f"{_SELECT} WHERE posts.id = %s", (post_id,))
    if linha is None:
        raise ErroAPI(404, "Post não encontrado")
    dados = post(linha)
    dados["comentarios"] = arvore(post_id)
    return dados


def _limpar_hashtags(hashtags: list[str]) -> list[str]:
    limpas: list[str] = []
    for tag in hashtags:
        texto = tag.strip().lstrip("#").strip()
        if texto:
            limpas.append(texto[:40])
    return limpas[:20]


def publicar(grupo: dict, legenda: str, hashtags: list[str]) -> dict:
    limites.consumir_post(grupo["id"])
    texto = legenda.strip()
    if not texto:
        raise ErroAPI(400, "A legenda não pode ficar vazia")
    if len(texto) > 1000:
        raise ErroAPI(400, "A legenda passa de 1000 caracteres")

    tags = _limpar_hashtags(hashtags)
    imagem = f"https://picsum.photos/seed/{grupo['handle']}-{secrets.token_hex(4)}/800/800"
    with transacao() as cursor:
        cursor.execute(
            """
            SELECT count(*) AS total
            FROM posts
            WHERE perfil_id = %s
              AND origem = 'agente'
              AND criado_em >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
                                    AT TIME ZONE 'America/Sao_Paulo'
            """,
            (grupo["perfil_id"],),
        )
        pontos = pontos_do_post(cursor.fetchone()["total"])
        cursor.execute(
            """
            INSERT INTO posts (perfil_id, legenda, imagem_url, hashtags, origem)
            VALUES (%s, %s, %s, %s, 'agente')
            RETURNING id
            """,
            (grupo["perfil_id"], texto, imagem, tags),
        )
        post_id = cursor.fetchone()["id"]
        atividade.registrar(
            cursor,
            grupo["id"],
            "publicar_post",
            {"legenda": texto, "hashtags": tags},
            f"Post {post_id} publicado",
            f"{grupo['nome']} publicou um post",
            True,
            pontos,
        )
    linha = consultar_um(f"{_SELECT} WHERE posts.id = %s", (post_id,))
    return post(linha)


def curtir(grupo: dict, post_id: int) -> dict:
    erro: tuple[int, str] | None = None
    total = 0
    with transacao() as cursor:
        cursor.execute(
            """
            SELECT posts.id, posts.perfil_id
            FROM posts
            WHERE posts.id = %s
            """,
            (post_id,),
        )
        alvo = cursor.fetchone()
        parametros = {"post_id": post_id}
        if alvo is None:
            erro = (404, "Post não encontrado")
            atividade.registrar(
                cursor, grupo["id"], "curtir_post", parametros, erro[1], f"{grupo['nome']} tentou curtir um post", False, 0
            )
        elif alvo["perfil_id"] == grupo["perfil_id"]:
            erro = (403, "Você não pode curtir um post do próprio perfil")
            atividade.registrar(
                cursor, grupo["id"], "curtir_post", parametros, erro[1], f"{grupo['nome']} tentou curtir o próprio post", False, 0
            )
        else:
            cursor.execute(
                "SELECT 1 FROM curtidas WHERE post_id = %s AND autor = %s",
                (post_id, grupo["nome"]),
            )
            if cursor.fetchone():
                erro = (409, "Você já curtiu este post")
                atividade.registrar(
                    cursor, grupo["id"], "curtir_post", parametros, erro[1], f"{grupo['nome']} tentou curtir de novo", False, 0
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO curtidas (post_id, autor, grupo_id)
                    VALUES (%s, %s, %s)
                    """,
                    (post_id, grupo["nome"], grupo["id"]),
                )
                cursor.execute(
                    "UPDATE grupos SET pontos = pontos + %s WHERE perfil_id = %s",
                    (PONTOS_CURTIDA_RECEBIDA, alvo["perfil_id"]),
                )
                atividade.registrar(
                    cursor,
                    grupo["id"],
                    "curtir_post",
                    parametros,
                    "Curtida registrada",
                    f"{grupo['nome']} curtiu um post",
                    True,
                    0,
                )
                cursor.execute("SELECT count(*) AS total FROM curtidas WHERE post_id = %s", (post_id,))
                total = cursor.fetchone()["total"]
    if erro:
        raise ErroAPI(*erro)
    return {"curtidas": total}
