"""Rotas abertas, sem token."""

from typing import Annotated, Literal

from fastapi import APIRouter, Query
from fastapi.responses import Response
from pydantic import BaseModel

from app.erros import ErroAPI
from app.servicos.atividade import listar_publicas, ranking
from app.servicos.config import estudo_liberado
from app.servicos.kit import gerar_zip_de_estudo
from app.servicos.perfis import listar as listar_perfis
from app.servicos.perfis import obter as obter_perfil
from app.servicos.posts import listar_feed, obter as obter_post
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
    """Diz se a API, o banco e o MCP estão no ar, e se os agentes estão pausados."""
    return obter_status()


@router.get("/feed")
def feed(
    limite: Annotated[int, Query(ge=1, le=50)] = 20,
    antes_de: int | None = None,
    perfil: str | None = None,
) -> list:
    """Posts mais recentes primeiro. Use antes_de com o id do último post para a página seguinte."""
    return listar_feed(limite, antes_de, perfil)


@router.get("/posts/{post_id}")
def ler_post(post_id: int) -> dict:
    """Post com os comentários. Os ocultos aparecem com o texto da moderação."""
    return obter_post(post_id)


@router.get("/perfis")
def perfis() -> list:
    return listar_perfis()


@router.get("/perfis/{handle}")
def ler_perfil(handle: str) -> dict:
    return obter_perfil(handle)


@router.get("/atividade")
def atividade(limite: Annotated[int, Query(ge=1, le=100)] = 30) -> list:
    return listar_publicas(limite)


@router.get("/ranking")
def placar() -> list:
    return ranking()


@router.get("/estudo")
def estudo() -> dict:
    """Diz se o instrutor já liberou o kit de estudo."""
    return {"liberado": estudo_liberado()}


@router.get("/estudo/kit")
def kit_de_estudo() -> Response:
    """Kit sem token e com os gabaritos. Só sai depois que o instrutor libera."""
    if not estudo_liberado():
        raise ErroAPI(403, "O kit de estudo é liberado pelo instrutor depois da aula")
    conteudo, nome = gerar_zip_de_estudo()
    return Response(
        content=conteudo,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{nome}"'},
    )
