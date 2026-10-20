"""Estado da API, do banco e do MCP."""

from app.db import consultar_um
from app.servicos.config import esta_pausado

VERSAO = "0.1.0"


def _mcp_no_ar() -> bool:
    try:
        from app.mcp_servidor import mcp_disponivel

        return mcp_disponivel()
    except Exception:
        return False


def obter_status() -> dict:
    """Confere o banco com SELECT 1 e se o gerenciador do MCP subiu com a API."""
    try:
        consultar_um("SELECT 1 AS ok")
        banco = "ok"
        pausados = esta_pausado()
    except Exception:
        banco = "erro"
        pausados = False
    return {
        "api": "ok",
        "banco": banco,
        "mcp": "ok" if _mcp_no_ar() else "erro",
        "agentes_pausados": pausados,
        "versao": VERSAO,
    }
