"""O site publicado precisa conseguir chamar a API pelo navegador."""

import pytest


@pytest.mark.parametrize(
    "origem",
    ["https://fakegram-oficina.vercel.app", "https://qualquer-coisa.lovable.app"],
)
def test_site_publicado_pode_chamar_a_api(cliente, origem):
    resposta = cliente.get("/api/status", headers={"Origin": origem})
    assert resposta.headers.get("access-control-allow-origin") == origem


def test_outro_site_nao_pode(cliente):
    resposta = cliente.get("/api/status", headers={"Origin": "https://fakegram-oficina.vercel.app.golpe.com"})
    assert "access-control-allow-origin" not in resposta.headers
