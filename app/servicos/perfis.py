"""Leitura dos perfis."""

from app.db import consultar, consultar_um
from app.erros import ErroAPI
from app.servicos.formato import perfil

_COLUNAS = """
    perfis.id AS perfil_id, perfis.handle, perfis.nome, perfis.avatar_url,
    perfis.bio, perfis.categoria, perfis.seguidores,
    grupos.id AS grupo_id,
    (SELECT count(*) FROM posts WHERE posts.perfil_id = perfis.id) AS total_posts
"""


def listar() -> list[dict]:
    linhas = consultar(
        f"""
        SELECT {_COLUNAS}
        FROM perfis
        LEFT JOIN grupos ON grupos.perfil_id = perfis.id
        ORDER BY perfis.handle
        """
    )
    return [perfil(linha) for linha in linhas]


def obter(handle: str) -> dict:
    from app.servicos.posts import listar_do_perfil

    linha = consultar_um(
        f"""
        SELECT {_COLUNAS}
        FROM perfis
        LEFT JOIN grupos ON grupos.perfil_id = perfis.id
        WHERE perfis.handle = %s
        """,
        (handle,),
    )
    if linha is None:
        raise ErroAPI(404, "Perfil não encontrado")
    dados = perfil(linha)
    dados["posts"] = listar_do_perfil(linha["perfil_id"])
    return dados
