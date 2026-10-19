"""Rotas abertas, sem token."""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.servicos.status import obter_status

router = APIRouter(prefix="/api", tags=["público"])


class StatusResposta(BaseModel):
    api: Literal["ok"]
    banco: Literal["ok", "erro"]
    mcp: Literal["ok", "erro"]
    agentes_pausados: bool
    versao: str


@router.get("/status", response_model=StatusResposta)
def ler_status() -> dict:
    """Diz se a API, o banco e o MCP estão no ar."""
    return obter_status()
