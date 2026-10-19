"""Estado da API, do banco e do MCP."""

from app.db import consultar_um

VERSAO = "0.1.0"


def obter_status() -> dict:
    """Confere o banco com SELECT 1. O MCP ainda não existe, então fica em erro."""
    try:
        consultar_um("SELECT 1 AS ok")
        banco = "ok"
    except Exception:
        banco = "erro"
    return {
        "api": "ok",
        "banco": banco,
        "mcp": "erro",
        "agentes_pausados": False,
        "versao": VERSAO,
    }
