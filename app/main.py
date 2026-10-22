"""Ponto de entrada da API. Sobe o pool do banco e padroniza os erros."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.config import config
from app.db import abrir_pool, fechar_pool
from app.erros import ErroAPI
from app.mcp_servidor import aplicacao_http, mcp
from app.rotas.admin import router as admin
from app.rotas.grupo import router as grupo
from app.rotas.publico import router as publico

LIMITE_CORPO = 100 * 1024


@asynccontextmanager
async def ciclo_de_vida(_: FastAPI):
    abrir_pool()
    async with mcp.session_manager.run():
        yield
    fechar_pool()


class LimiteDeCorpo:
    """Recusa pedido cujo corpo passe de 100 KB."""

    def __init__(self, app, limite: int = LIMITE_CORPO):
        self.app = app
        self.limite = limite

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        partes: list[bytes] = []
        tamanho = 0
        while True:
            mensagem = await receive()
            if mensagem["type"] == "http.disconnect":
                return
            bloco = mensagem.get("body", b"")
            tamanho += len(bloco)
            partes.append(bloco)
            if tamanho > self.limite or not mensagem.get("more_body", False):
                break
        corpo = b"".join(partes)
        if tamanho > self.limite:
            resposta = JSONResponse(
                status_code=413,
                content={"erro": "O corpo da requisição passa de 100 KB"},
            )

            async def sem_corpo():
                return {"type": "http.request", "body": b"", "more_body": False}

            await resposta(scope, sem_corpo, send)
            return
        enviado = False

        async def repetir():
            nonlocal enviado
            if enviado:
                return {"type": "http.request", "body": b"", "more_body": False}
            enviado = True
            return {"type": "http.request", "body": corpo, "more_body": False}

        await self.app(scope, repetir, send)


class McpSemBarra:
    """Faz /mcp responder como /mcp/, sem redirecionar.

    Pendurado em /mcp, o Starlette responde 307 para /mcp/. O cliente MCP do
    Langflow não segue redirecionamentos, então o endereço do kit falharia.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["path"] == "/mcp":
            scope = {**scope, "path": "/mcp/", "raw_path": b"/mcp/"}
        await self.app(scope, receive, send)


app = FastAPI(title="Fakegram API", lifespan=ciclo_de_vida)
app.add_middleware(LimiteDeCorpo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.origens_cors,
    allow_origin_regex=r"https://.*\.lovable\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(McpSemBarra)
app.include_router(publico)
app.include_router(grupo)
app.include_router(admin)
# O app do MCP tem a rota "/". Pendurar em /mcp deixa o endereço exatamente /mcp.
app.mount("/mcp", aplicacao_http)


def _texto(detalhe: object) -> str:
    if detalhe == "Not Found":
        return "Não encontrado"
    if detalhe == "Method Not Allowed":
        return "Método não permitido"
    if isinstance(detalhe, str):
        return detalhe
    return "Não foi possível concluir a operação"


@app.exception_handler(ErroAPI)
async def erro_de_regra(_: Request, exc: ErroAPI) -> JSONResponse:
    return JSONResponse(status_code=exc.status, content={"erro": exc.mensagem})


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
