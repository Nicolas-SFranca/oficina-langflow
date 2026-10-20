"""Grava e lista o diário de ações dos grupos."""

from psycopg.types.json import Json

from app.db import consultar
from app.tempo import iso


def registrar(
    cursor,
    grupo_id: int,
    ferramenta: str,
    parametros: dict,
    resultado: str,
    resumo: str,
    sucesso: bool,
    pontos: int,
) -> None:
    """Grava a ação e, se houve pontos, soma no placar do grupo. Usa o cursor da transação atual."""
    cursor.execute(
        """
        INSERT INTO acoes_agente
            (grupo_id, ferramenta, parametros, resultado, resumo, sucesso, pontos)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (grupo_id, ferramenta, Json(parametros), resultado[:500], resumo, sucesso, pontos),
    )
    if pontos:
        cursor.execute(
            "UPDATE grupos SET pontos = pontos + %s WHERE id = %s",
            (pontos, grupo_id),
        )


def listar_publicas(limite: int) -> list[dict]:
    linhas = consultar(
        """
        SELECT acoes_agente.id, grupos.nome AS grupo, perfis.handle AS perfil_handle,
               acoes_agente.ferramenta, acoes_agente.resumo, acoes_agente.sucesso,
               acoes_agente.criado_em
        FROM acoes_agente
        JOIN grupos ON grupos.id = acoes_agente.grupo_id
        JOIN perfis ON perfis.id = grupos.perfil_id
        ORDER BY acoes_agente.criado_em DESC, acoes_agente.id DESC
        LIMIT %s
        """,
        (limite,),
    )
    return [
        {
            "id": linha["id"],
            "grupo": linha["grupo"],
            "perfil_handle": linha["perfil_handle"],
            "ferramenta": linha["ferramenta"],
            "resumo": linha["resumo"],
            "sucesso": linha["sucesso"],
            "criado_em": iso(linha["criado_em"]),
        }
        for linha in linhas
    ]


def listar_do_grupo(grupo_id: int, limite: int) -> list[dict]:
    linhas = consultar(
        """
        SELECT acoes_agente.id, grupos.nome AS grupo, perfis.handle AS perfil_handle,
               acoes_agente.ferramenta, acoes_agente.parametros, acoes_agente.resultado,
               acoes_agente.resumo, acoes_agente.sucesso, acoes_agente.criado_em
        FROM acoes_agente
        JOIN grupos ON grupos.id = acoes_agente.grupo_id
        JOIN perfis ON perfis.id = grupos.perfil_id
        WHERE acoes_agente.grupo_id = %s
        ORDER BY acoes_agente.criado_em DESC, acoes_agente.id DESC
        LIMIT %s
        """,
        (grupo_id, limite),
    )
    return [
        {
            "id": linha["id"],
            "grupo": linha["grupo"],
            "perfil_handle": linha["perfil_handle"],
            "ferramenta": linha["ferramenta"],
            "parametros": linha["parametros"] if isinstance(linha["parametros"], dict) else {},
            "resultado": linha["resultado"],
            "resumo": linha["resumo"],
            "sucesso": linha["sucesso"],
            "criado_em": iso(linha["criado_em"]),
        }
        for linha in linhas
    ]


def ranking() -> list[dict]:
    linhas = consultar(
        """
        SELECT grupos.nome AS grupo, perfis.handle AS perfil_handle, grupos.pontos,
               (SELECT count(*) FROM acoes_agente
                 WHERE grupo_id = grupos.id AND ferramenta = 'responder_comentario' AND sucesso
               ) AS respostas,
               (SELECT count(*) FROM acoes_agente
                 WHERE grupo_id = grupos.id AND ferramenta = 'ocultar_comentario'
                   AND sucesso AND pontos > 0
               ) AS moderacoes_corretas,
               (SELECT count(*) FROM acoes_agente
                 WHERE grupo_id = grupos.id AND ferramenta = 'publicar_post' AND sucesso
               ) AS posts
        FROM grupos
        JOIN perfis ON perfis.id = grupos.perfil_id
        ORDER BY grupos.pontos DESC, grupos.id
        """
    )
    return [
        {
            "posicao": indice,
            "grupo": linha["grupo"],
            "perfil_handle": linha["perfil_handle"],
            "pontos": linha["pontos"],
            "respostas": linha["respostas"],
            "moderacoes_corretas": linha["moderacoes_corretas"],
            "posts": linha["posts"],
        }
        for indice, linha in enumerate(linhas, start=1)
    ]
