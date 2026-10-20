"""Aponta os testes para a branch testes e recria os dados uma vez."""

import os
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))

from scripts.migrar import aplicar, ler_env

_AMBIENTE = ler_env(RAIZ / ".env")
_TESTE = _AMBIENTE.get("TEST_DATABASE_URL", "")
_PRODUCAO = _AMBIENTE.get("DATABASE_URL", "")

if not _TESTE:
    raise RuntimeError(
        "Defina TEST_DATABASE_URL no .env com a branch testes. Os testes não usam o banco da aula."
    )
if _TESTE == _PRODUCAO:
    raise RuntimeError("TEST_DATABASE_URL não pode ser igual ao DATABASE_URL.")

os.environ["DATABASE_URL"] = _TESTE


@pytest.fixture(scope="session")
def cliente():
    from fastapi.testclient import TestClient

    from app.main import app
    from app.servicos.seed import recriar_dados

    aplicar(_TESTE, _AMBIENTE.get("ALUNO_LEITURA_SENHA", ""))
    with TestClient(app) as cliente_http:
        recriar_dados()
        yield cliente_http


@pytest.fixture(autouse=True)
def _limpar(cliente):
    from app.servicos.config import definir_pausado
    from app.servicos.limites import reiniciar

    reiniciar()
    definir_pausado(False)
    yield
    reiniciar()
    definir_pausado(False)


@pytest.fixture
def auth(cliente):
    from app.db import consultar_um

    linha = consultar_um("SELECT token FROM grupos WHERE nome = %s", ("Grupo 1",))
    return {"Authorization": f"Bearer {linha['token']}"}


@pytest.fixture
def admin():
    from app.config import config

    return {"X-Admin-Key": config.admin_key}
