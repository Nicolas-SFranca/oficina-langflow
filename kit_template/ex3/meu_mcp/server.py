"""MCP local do exercício 3.

Rode a partir da pasta do kit (no Windows):
    .venv\\Scripts\\python ex3\\meu_mcp\\server.py
O servidor fica em http://localhost:8001/mcp.
No pacote mcp 2, a classe que antes se chamava FastMCP agora se chama MCPServer.

Nível 1: rode do jeito que está e conecte no Langflow.
Nível 2: faça o TODO 1. Nível 3: faça o TODO 2.
"""

import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from mcp.server.mcpserver import MCPServer

# O .env está na raiz do kit, duas pastas acima deste arquivo.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

API_URL = os.getenv("API_URL", "").rstrip("/")
TOKEN = os.getenv("TOKEN", "")
if not API_URL or not TOKEN:
    raise SystemExit("Confira API_URL e TOKEN no .env do kit.")

mcp = MCPServer("Fakegram do grupo")


def pedir(metodo: str, caminho: str, corpo: dict | None = None) -> dict | list:
    """Chama a API do Fakegram com o token deste grupo."""
    with httpx.Client(base_url=API_URL, headers={"Authorization": f"Bearer {TOKEN}"}, timeout=30) as cliente:
        resposta = cliente.request(metodo, caminho, json=corpo)
    if "application/json" not in resposta.headers.get("content-type", ""):
        return {"erro": f"A API respondeu {resposta.status_code}"}
    return resposta.json()


@mcp.tool()
def meu_perfil() -> dict:
    """Mostra o perfil que este grupo administra.

    Use no começo da conversa. Devolve o handle, o nome e quantos
    comentários das últimas 24 horas ainda estão sem resposta.
    A docstring é o que o modelo lê para decidir quando chamar a ferramenta.
    """
    dados = pedir("GET", "/api/grupo/me")
    if isinstance(dados, dict) and "erro" in dados:
        return dados
    return {
        "grupo": dados["nome"],
        "handle": dados["perfil"]["handle"],
        "nome": dados["perfil"]["nome"],
        "comentarios_sem_resposta": dados["metricas"]["comentarios_sem_resposta"],
    }


@mcp.tool()
def ler_comentarios(post_id: int, apenas_sem_resposta: bool = True) -> dict | list:
    """Lê os comentários de um post do próprio perfil.

    post_id é o número do post. apenas_sem_resposta, no padrão verdadeiro,
    traz só a fila das últimas 24 horas, a que ninguém respondeu.
    Cada item tem id, autor e texto. O id serve para moderar_comentario.
    """
    filtro = str(apenas_sem_resposta).lower()
    return pedir("GET", f"/api/grupo/posts/{post_id}/comentarios?apenas_sem_resposta={filtro}")


# TODO 1 (nível 2) — ferramenta moderar_comentario(comentario_id: int, motivo: str)
#
# Ela oculta um comentário que seja spam ou ofensivo.
# Chame POST /api/grupo/comentarios/{comentario_id}/ocultar
# com o JSON {"motivo": motivo}. Use a função pedir.
#
# A docstring precisa dizer para que serve e o que é cada parâmetro.
# Sem isso o agente não escolhe a ferramenta. Modelo:
#
# @mcp.tool()
# def moderar_comentario(comentario_id: int, motivo: str) -> dict:
#     """Oculta um comentário que seja spam ou ofensivo.
#
#     comentario_id é o id que veio de fila_de_comentarios.
#     motivo é uma frase curta dizendo por que o comentário sai do ar.
#     """

# TODO 2 (nível 3) — ferramenta sugerir_hashtags(texto: str) -> list[str]
#
# Não chame a API. Esta lógica fica só neste arquivo.
# Separe as palavras de texto, ignore as que têm menos de 4 letras,
# não repita e devolva no máximo 5, sem o caractere #.
# Escreva a docstring explicando o parâmetro texto.


if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host="127.0.0.1",
        port=8001,
        streamable_http_path="/mcp",
        stateless_http=True,
        json_response=True,
    )
