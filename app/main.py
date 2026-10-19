"""Ponto de entrada da API. Sobe o pool do banco e padroniza os erros."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.config import config
from app.db import abrir_pool, fechar_pool
from app.rotas.admin import router as admin
from app.rotas.grupo import router as grupo
from app.rotas.publico import router as publico


@asynccontextmanager
async def ciclo_de_vida(_: FastAPI):
    abrir_pool()
    yield
    fechar_pool()


app = FastAPI(title="Fakegram API", lifespan=ciclo_de_vida)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.origens_cors,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(publico)
app.include_router(grupo)
app.include_router(admin)


def _texto(detalhe: object) -> str:
    if isinstance(detalhe, str):
        return detalhe
    return "Não foi possível concluir a operação"


@app.exception_handler(HTTPException)
async def erro_http(_: Request, exc: HTTPException) -> JSONResponse:
    """Cobre o HTTPException do Starlette e o do FastAPI, que herda dele."""
    return JSONResponse(status_code=exc.status_code, content={"erro": _texto(exc.detail)})


@app.exception_handler(RequestValidationError)
async def erro_de_validacao(_: Request, exc: RequestValidationError) -> JSONResponse:
    partes: list[str] = []
    for item in exc.errors():
        campo = ".".join(str(parte) for parte in item.get("loc", []) if parte not in ("body", "query"))
        mensagem = item.get("msg", "valor inválido")
        partes.append(f"{campo}: {mensagem}" if campo else mensagem)
    texto = "; ".join(partes) or "Dados inválidos"
    return JSONResponse(status_code=400, content={"erro": texto})
