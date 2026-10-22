"""Rotas do grupo. Exigem Authorization: Bearer <token>."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.dependencias import exigir_acao, grupo_atual
from app.erros import ErroAPI
from app.servicos.atividade import listar_do_grupo
from app.servicos.comentarios import fila_do_grupo, listar_para_grupo, ocultar, responder
from app.servicos.grupos import painel
from app.servicos.posts import curtir, listar_do_perfil, publicar

router = APIRouter(prefix="/api/grupo", tags=["grupo"])


class NovoPost(BaseModel):
    legenda: str = Field(min_length=1, max_length=1000)
    hashtags: list[str] = []


class NovaResposta(BaseModel):
    texto: str = Field(min_length=1, max_length=500)


class Ocultar(BaseModel):
    motivo: str = Field(min_length=1, max_length=200)


@router.get("/me")
def eu(grupo: dict = Depends(grupo_atual)) -> dict:
    return painel(grupo["id"])


@router.get("/log")
def log(
    limite: Annotated[int, Query(ge=1, le=100)] = 50,
    grupo: dict = Depends(grupo_atual),
) -> list:
    return listar_do_grupo(grupo["id"], limite)


@router.get("/posts")
def posts(
    limite: Annotated[int, Query(ge=1, le=50)] = 10,
    grupo: dict = Depends(grupo_atual),
) -> list:
    return listar_do_perfil(grupo["perfil_id"], limite)


@router.get("/fila")
def fila(
    limite: Annotated[int, Query(ge=1, le=50)] = 20,
    grupo: dict = Depends(grupo_atual),
) -> list:
    return fila_do_grupo(grupo, limite)


@router.get("/posts/{post_id}/comentarios")
def comentarios(
    post_id: int,
    apenas_sem_resposta: bool = True,
    grupo: dict = Depends(grupo_atual),
) -> list:
    return listar_para_grupo(grupo, post_id, apenas_sem_resposta)


@router.post("/posts")
def novo_post(corpo: NovoPost, grupo: dict = Depends(exigir_acao)) -> dict:
    return publicar(grupo, corpo.legenda, corpo.hashtags)


@router.post("/posts/{post_id}/curtir")
def curtir_post(post_id: int, grupo: dict = Depends(exigir_acao)) -> dict:
    return curtir(grupo, post_id)


@router.post("/comentarios/{comentario_id}/responder")
def responder_comentario(comentario_id: int, corpo: NovaResposta, grupo: dict = Depends(exigir_acao)) -> dict:
    return responder(grupo, comentario_id, corpo.texto)


@router.post("/comentarios/{comentario_id}/ocultar")
def ocultar_comentario(comentario_id: int, corpo: Ocultar, grupo: dict = Depends(exigir_acao)) -> dict:
    return ocultar(grupo, comentario_id, corpo.motivo)


@router.get("/kit")
def kit(_grupo: dict = Depends(grupo_atual)) -> None:
    """O arquivo do exercício entra numa fase seguinte."""
    raise ErroAPI(501, "O kit do grupo ainda não está disponível")
