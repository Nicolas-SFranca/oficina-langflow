"""Quem pode chamar cada rota: grupo pelo token, instrutor pela chave."""

import secrets
from typing import Annotated

from fastapi import Depends, Header

from app.config import config
from app.erros import ErroAPI
from app.servicos import limites
from app.servicos.config import esta_pausado
from app.servicos.grupos import por_token


def grupo_atual(authorization: Annotated[str | None, Header()] = None) -> dict:
    """Lê Authorization: Bearer. 401 se o token não existe, 403 se o grupo foi desativado."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ErroAPI(401, "Token do grupo ausente ou inválido")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise ErroAPI(401, "Token do grupo ausente ou inválido")
    grupo = por_token(token)
    if grupo is None:
        raise ErroAPI(401, "Token do grupo ausente ou inválido")
    if not grupo["ativo"]:
        raise ErroAPI(403, "Grupo inativo")
    return grupo


def exigir_acao(grupo: dict = Depends(grupo_atual)) -> dict:
    """Ação de grupo: bloqueia quando o instrutor pausou e quando estourou o limite."""
    if esta_pausado():
        raise ErroAPI(423, "Agentes pausados pelo instrutor")
    limites.consumir_acao(grupo["id"])
    return grupo


def exigir_admin(x_admin_key: Annotated[str | None, Header()] = None) -> None:
    if not x_admin_key:
        raise ErroAPI(401, "Chave de administrador inválida")
    try:
        confere = secrets.compare_digest(x_admin_key, config.admin_key)
    except Exception:
        confere = False
    if not confere:
        raise ErroAPI(401, "Chave de administrador inválida")
