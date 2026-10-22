"""O endereço do MCP que vai no kit precisa responder sem redirecionar."""

CABECALHOS = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


def _listar_ferramentas(cliente, caminho: str):
    return cliente.post(
        caminho,
        headers=CABECALHOS,
        json={"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}},
        follow_redirects=False,
    )


def test_mcp_sem_barra_responde_sem_redirecionar(cliente):
    # O cliente MCP do Langflow não segue redirecionamentos.
    resposta = _listar_ferramentas(cliente, "/mcp")
    assert resposta.status_code == 200
    nomes = {ferramenta["name"] for ferramenta in resposta.json()["result"]["tools"]}
    assert {"meu_perfil", "fila_de_comentarios", "responder_comentario"} <= nomes


def test_mcp_com_barra_continua_funcionando(cliente):
    assert _listar_ferramentas(cliente, "/mcp/").status_code == 200
