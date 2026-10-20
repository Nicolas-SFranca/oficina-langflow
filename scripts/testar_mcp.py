"""Prova o MCP local: lista as ferramentas e chama meu_perfil e listar_posts.

Uso: python scripts/testar_mcp.py <token>
"""

import asyncio
import sys

import httpx2
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

URL = "http://localhost:8000/mcp"


def _texto(resultado) -> str:
    if getattr(resultado, "is_error", False):
        prefixo = "erro: "
    else:
        prefixo = ""
    partes = []
    for bloco in getattr(resultado, "content", []) or []:
        texto = getattr(bloco, "text", None)
        if texto:
            partes.append(texto)
    return prefixo + ("\n".join(partes) if partes else str(resultado))


async def executar(token: str, url: str = URL) -> None:
    async with httpx2.AsyncClient(headers={"Authorization": f"Bearer {token}"}, timeout=30) as cliente_http:
        async with streamable_http_client(url, http_client=cliente_http) as (leitura, escrita):
            async with ClientSession(leitura, escrita) as sessao:
                await sessao.initialize()
                lista = await sessao.list_tools()
                nomes = [ferramenta.name for ferramenta in lista.tools]
                print("ferramentas:", ", ".join(nomes))
                print("meu_perfil:", _texto(await sessao.call_tool("meu_perfil", {})))
                print("listar_posts:", _texto(await sessao.call_tool("listar_posts", {"limite": 3})))


def main() -> None:
    if len(sys.argv) != 2 or not sys.argv[1].strip():
        raise SystemExit("Uso: python scripts/testar_mcp.py <token>")
    asyncio.run(executar(sys.argv[1].strip()))


if __name__ == "__main__":
    main()
