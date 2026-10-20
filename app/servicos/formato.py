"""Monta os dicionários no formato do contrato."""

from app.tempo import iso


def perfil(linha: dict) -> dict:
    return {
        "id": linha["perfil_id"],
        "handle": linha["handle"],
        "nome": linha["nome_perfil"] if "nome_perfil" in linha else linha["nome"],
        "avatar_url": linha["avatar_url"],
        "bio": linha["bio"],
        "categoria": linha["categoria"],
        "grupo_id": linha["grupo_id"],
        "seguidores": linha["seguidores"],
        "total_posts": linha["total_posts"],
    }


def perfil_resumo(linha: dict) -> dict:
    return {
        "id": linha["perfil_id"],
        "handle": linha["handle"],
        "nome": linha["nome"],
        "avatar_url": linha["avatar_url"],
    }


def post(linha: dict) -> dict:
    return {
        "id": linha["id"],
        "perfil": perfil_resumo(linha),
        "legenda": linha["legenda"],
        "imagem_url": linha["imagem_url"],
        "hashtags": list(linha["hashtags"] or []),
        "curtidas": linha["curtidas"],
        "total_comentarios": linha["total_comentarios"],
        "origem": linha["origem"],
        "criado_em": iso(linha["criado_em"]),
    }


def comentario(linha: dict) -> dict:
    """Comentário oculto perde o texto original. O tipo do gabarito não sai daqui."""
    texto = "[comentário removido pela moderação]" if linha["oculto"] else linha["texto"]
    return {
        "id": linha["id"],
        "post_id": linha["post_id"],
        "autor": linha["autor"],
        "texto": texto,
        "origem": linha["origem"],
        "oculto": linha["oculto"],
        "resposta_de_id": linha["resposta_de_id"],
        "criado_em": iso(linha["criado_em"]),
    }
