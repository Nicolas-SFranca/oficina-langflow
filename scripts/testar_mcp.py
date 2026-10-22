"""Prova um MCP: lista as ferramentas e chama meu_perfil.

Uso: python scripts/testar_mcp.py <token> [url]
A url padrão é http://localhost:8000/mcp. Para o exercício 3, use a porta 8001.
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
                if "listar_posts" in nomes:
                    print("listar_posts:", _texto(await sessao.call_tool("listar_posts", {"limite": 3})))
                if "fila_de_comentarios" in nomes:
                    fila = await sessao.call_tool("fila_de_comentarios", {"limite": 5})
                    print("fila_de_comentarios:", _texto(fila))


def main() -> None:
    if len(sys.argv) < 2 or len(sys.argv) > 3 or not sys.argv[1].strip():
        raise SystemExit("Uso: python scripts/testar_mcp.py <token> [url]")
    url = sys.argv[2].strip() if len(sys.argv) == 3 else URL
    asyncio.run(executar(sys.argv[1].strip(), url))


if __name__ == "__main__":
    main()
