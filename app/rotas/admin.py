"""Rotas do instrutor. Exigem o header X-Admin-Key."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.dependencias import exigir_admin
from app.servicos.comentarios import simular
from app.servicos.config import definir_pausado
from app.servicos.grupos import criar, listar_admin, revogar
from app.servicos.seed import recriar_dados

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(exigir_admin)])


class NovoGrupo(BaseModel):
    nome: str = Field(min_length=1, max_length=80)
    perfil_id: int


class Pausar(BaseModel):
    pausado: bool


class Simular(BaseModel):
    quantidade: int = Field(ge=1, le=100)


@router.get("/grupos")
def grupos() -> list:
    return listar_admin()


@router.post("/grupos")
def novo_grupo(corpo: NovoGrupo) -> dict:
    return criar(corpo.nome, corpo.perfil_id)


@router.post("/grupos/{grupo_id}/revogar")
def revogar_grupo(grupo_id: int) -> dict:
    return revogar(grupo_id)


@router.post("/pausar")
def pausar(corpo: Pausar) -> dict:
    return {"pausado": definir_pausado(corpo.pausado)}


@router.post("/reset")
def reset() -> dict:
    recriar_dados()
    return {"ok": True}


@router.post("/simular")
def simular_interacoes(corpo: Simular) -> dict:
    return simular(corpo.quantidade)
