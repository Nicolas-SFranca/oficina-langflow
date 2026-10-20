"""Grupos: achar pelo token, montar o painel e administrar."""

import secrets

from app.config import config
from app.db import consultar, consultar_um, transacao
from app.erros import ErroAPI
from app.servicos.formato import perfil

_COLUNAS = """
    grupos.id, grupos.nome, grupos.token, grupos.ativo, grupos.pontos,
    perfis.id AS perfil_id, perfis.handle, perfis.nome AS nome_perfil, perfis.avatar_url,
    perfis.bio, perfis.categoria, perfis.seguidores,
    grupos.id AS grupo_id,
    (SELECT count(*) FROM posts WHERE posts.perfil_id = perfis.id) AS total_posts
"""


def _formato(linha: dict, com_token: bool) -> dict:
    dados = {
        "id": linha["id"],
        "nome": linha["nome"],
        "perfil": perfil(linha),
        "pontos": linha["pontos"],
        "ativo": linha["ativo"],
    }
    if com_token:
        dados["token"] = linha["token"]
    return dados


def por_token(token: str) -> dict | None:
    return consultar_um(
        f"""
        SELECT {_COLUNAS}
        FROM grupos
        JOIN perfis ON perfis.id = grupos.perfil_id
        WHERE grupos.token = %s
        """,
        (token,),
    )


def _por_id(cursor, grupo_id: int) -> dict | None:
    cursor.execute(
        f"""
        SELECT {_COLUNAS}
        FROM grupos
        JOIN perfis ON perfis.id = grupos.perfil_id
        WHERE grupos.id = %s
        """,
        (grupo_id,),
    )
    return cursor.fetchone()


def painel(grupo_id: int) -> dict:
    linha = consultar_um(
        f"""
        SELECT {_COLUNAS},
               (SELECT count(*) FROM curtidas
                 JOIN posts ON posts.id = curtidas.post_id
                 WHERE posts.perfil_id = grupos.perfil_id) AS curtidas_recebidas,
               (SELECT count(*) FROM comentarios
                 JOIN posts ON posts.id = comentarios.post_id
                 WHERE posts.perfil_id = grupos.perfil_id
                   AND comentarios.resposta_de_id IS NULL
                   AND comentarios.oculto = false
                   AND NOT EXISTS (
                       SELECT 1 FROM comentarios resposta
                       WHERE resposta.resposta_de_id = comentarios.id
                   )) AS comentarios_sem_resposta,
               (SELECT count(*) FROM posts
                 WHERE posts.perfil_id = grupos.perfil_id
                   AND posts.criado_em >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
                                         AT TIME ZONE 'America/Sao_Paulo') AS posts_hoje
        FROM grupos
        JOIN perfis ON perfis.id = grupos.perfil_id
        WHERE grupos.id = %s
        """,
        (grupo_id,),
    )
    if linha is None:
        raise ErroAPI(404, "Grupo não encontrado")
    dados = _formato(linha, com_token=False)
    base = config.public_api_url.rstrip("/")
    dados["mcp_url"] = f"{base}/mcp"
    dados["metricas"] = {
        "curtidas_recebidas": linha["curtidas_recebidas"],
        "comentarios_sem_resposta": linha["comentarios_sem_resposta"],
        "posts_hoje": linha["posts_hoje"],
    }
    return dados


def listar_admin() -> list[dict]:
    linhas = consultar(
        f"""
        SELECT {_COLUNAS}
        FROM grupos
        JOIN perfis ON perfis.id = grupos.perfil_id
        ORDER BY grupos.id
        """
    )
    return [_formato(linha, com_token=True) for linha in linhas]


def criar(nome: str, perfil_id: int) -> dict:
    erro: tuple[int, str] | None = None
    criado: dict | None = None
    with transacao() as cursor:
        cursor.execute("SELECT id FROM perfis WHERE id = %s", (perfil_id,))
        if cursor.fetchone() is None:
            erro = (404, "Perfil não encontrado")
        else:
            cursor.execute("SELECT id FROM grupos WHERE perfil_id = %s", (perfil_id,))
            if cursor.fetchone():
                erro = (409, "Esse perfil já tem um grupo")
            else:
                token = secrets.token_urlsafe(16)
                cursor.execute(
                    """
                    INSERT INTO grupos (nome, token, ativo, perfil_id, pontos)
                    VALUES (%s, %s, true, %s, 0)
                    RETURNING id
                    """,
                    (nome.strip(), token, perfil_id),
                )
                criado = _por_id(cursor, cursor.fetchone()["id"])
    if erro:
        raise ErroAPI(*erro)
    return _formato(criado, com_token=True)


def revogar(grupo_id: int) -> dict:
    """Troca o token. O token antigo deixa de valer e o grupo continua ativo."""
    with transacao() as cursor:
        cursor.execute("SELECT id FROM grupos WHERE id = %s", (grupo_id,))
        if cursor.fetchone() is None:
            erro = (404, "Grupo não encontrado")
            linha = None
        else:
            cursor.execute(
                "UPDATE grupos SET token = %s WHERE id = %s",
                (secrets.token_urlsafe(16), grupo_id),
            )
            linha = _por_id(cursor, grupo_id)
            erro = None
    if erro:
        raise ErroAPI(*erro)
    return _formato(linha, com_token=True)
