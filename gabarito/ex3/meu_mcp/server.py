"""Solução do exercício 3 (níveis 2 e 3). Só vai no kit de estudo, nunca no kit do grupo.

Rode a partir da pasta do kit, com o .env preenchido, ou compare com
ex3/meu_mcp/server.py.
No pacote mcp 2, FastMCP se chama MCPServer.
"""

import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from mcp.server.mcpserver import MCPServer

# Sobe até achar um .env (kit gerado ou a pasta de trabalho).
for candidato in Path(__file__).resolve().parents:
    if (candidato / ".env").exists() and candidato.name != "gabarito":
        load_dotenv(candidato / ".env")
        break

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
    """
    dados = pedir("GET", "/api/grupo/me")
    if not isinstance(dados, dict) or "erro" in dados:
        return dados if isinstance(dados, dict) else {"erro": "resposta inesperada"}
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
    """
    filtro = str(apenas_sem_resposta).lower()
    return pedir("GET", f"/api/grupo/posts/{post_id}/comentarios?apenas_sem_resposta={filtro}")


@mcp.tool()
def moderar_comentario(comentario_id: int, motivo: str) -> dict:
    """Oculta um comentário que seja spam ou ofensivo.

    comentario_id é o id que veio de fila_de_comentarios.
    motivo é uma frase curta dizendo por que o comentário sai do ar.
    Ocultar spam ou ofensivo soma pontos. Ocultar um comentário legítimo tira pontos.
    """
    dados = pedir(
        "POST",
        f"/api/grupo/comentarios/{comentario_id}/ocultar",
        {"motivo": motivo},
    )
    return dados if isinstance(dados, dict) else {"erro": "resposta inesperada"}


@mcp.tool()
def sugerir_hashtags(texto: str) -> list[str]:
    """Sugere até 5 hashtags a partir de um texto, sem chamar a internet.

    texto é a legenda ou a frase que o grupo quer publicar.
    A função separa as palavras, ignora as de menos de 4 letras e não repete.
    O retorno não leva o caractere #.
    """
    vistas: list[str] = []
    for bruta in texto.replace("#", " ").split():
        limpa = "".join(letra for letra in bruta.lower() if letra.isalnum())
        if len(limpa) >= 4 and limpa not in vistas:
            vistas.append(limpa)
    vistas.sort(key=len, reverse=True)
    return vistas[:5]


if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host="127.0.0.1",
        port=8001,
        streamable_http_path="/mcp",
        stateless_http=True,
        json_response=True,
    )
