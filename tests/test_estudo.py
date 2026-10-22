"""Kit do grupo e kit de estudo: quem recebe token, quem recebe gabarito e quando."""

import io
import zipfile

import pytest

from app.db import consultar


@pytest.fixture
def estudo_fechado(cliente, admin):
    cliente.post("/api/admin/estudo", headers=admin, json={"liberado": False})
    yield
    cliente.post("/api/admin/estudo", headers=admin, json={"liberado": False})


def _zip(resposta) -> zipfile.ZipFile:
    assert resposta.status_code == 200
    assert resposta.headers["content-type"] == "application/zip"
    return zipfile.ZipFile(io.BytesIO(resposta.content))


def test_kit_do_grupo_leva_o_token_e_nao_leva_gabarito(cliente, auth):
    kit = _zip(cliente.get("/api/grupo/kit", headers=auth))
    nomes = kit.namelist()
    assert not any(nome.startswith("gabarito/") for nome in nomes)
    assert {"ex1/LEIAME.md", "ex2/LEIAME.md", "ex3/meu_mcp/server.py", "bonus/rag/manuais/graofino.md"} <= set(nomes)
    token = auth["Authorization"].split(" ", 1)[1]
    assert f"TOKEN={token}" in kit.read(".env").decode("utf-8")
    assert "{{" not in kit.read("README.md").decode("utf-8")


def test_kit_de_estudo_fica_fechado_ate_o_instrutor_liberar(cliente, estudo_fechado):
    assert cliente.get("/api/estudo").json() == {"liberado": False}
    resposta = cliente.get("/api/estudo/kit")
    assert resposta.status_code == 403
    assert "erro" in resposta.json()


def test_so_o_admin_libera_o_kit_de_estudo(cliente, estudo_fechado):
    resposta = cliente.post("/api/admin/estudo", json={"liberado": True})
    assert resposta.status_code == 401
    assert cliente.get("/api/estudo").json() == {"liberado": False}


def test_kit_de_estudo_traz_gabarito_e_nenhum_segredo(cliente, admin, estudo_fechado):
    liberar = cliente.post("/api/admin/estudo", headers=admin, json={"liberado": True})
    assert liberar.json() == {"liberado": True}
    kit = _zip(cliente.get("/api/estudo/kit"))
    nomes = kit.namelist()
    assert "gabarito/ex3/meu_mcp/server.py" in nomes
    assert "ex3/meu_mcp/server.py" in nomes

    conteudo = "\n".join(kit.read(nome).decode("utf-8", errors="ignore") for nome in nomes)
    tokens = [linha["token"] for linha in consultar("SELECT token FROM grupos")]
    assert not any(token in conteudo for token in tokens)
    env = kit.read(".env").decode("utf-8")
    assert "TOKEN=cole-aqui-o-token-do-seu-grupo" in env
    assert "NEON_RO_URL=\n" in env.replace("\r\n", "\n")
