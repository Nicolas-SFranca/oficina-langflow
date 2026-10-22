"""Dispara um fluxo do Langflow local e imprime só o texto da resposta.

Uso, na pasta do kit:
    python ex3/chamar_fluxo.py
    python ex3/chamar_fluxo.py --loop
"""

import argparse
import os
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

LANGFLOW = "http://localhost:7860"
PEDIDO = "Responda os comentários pendentes do meu perfil e oculte o spam."


def extrair_texto(dados: dict) -> str:
    """Procura o texto da mensagem na resposta do Langflow."""
    for bloco in dados.get("outputs") or []:
        for item in bloco.get("outputs") or []:
            mensagem = (item.get("results") or {}).get("message") or {}
            if isinstance(mensagem, dict) and mensagem.get("text"):
                return str(mensagem["text"])
            for uma in item.get("messages") or []:
                if isinstance(uma, dict) and uma.get("message"):
                    return str(uma["message"])
    return str(dados)


def pedir(texto: str) -> str:
    fluxo = os.getenv("FLOW_ID", "").strip()
    chave = os.getenv("LANGFLOW_API_KEY", "").strip()
    if not fluxo or not chave:
        raise SystemExit("Preencha FLOW_ID e LANGFLOW_API_KEY no .env do kit.")
    resposta = httpx.post(
        f"{LANGFLOW}/api/v1/run/{fluxo}",
        headers={"x-api-key": chave},
        json={"input_value": texto, "input_type": "chat", "output_type": "chat"},
        timeout=120,
    )
    if resposta.status_code >= 400:
        raise SystemExit(f"Langflow respondeu {resposta.status_code}: {resposta.text[:300]}")
    return extrair_texto(resposta.json())


def main() -> None:
    parser = argparse.ArgumentParser(description="Chama o fluxo do Langflow local.")
    parser.add_argument("--loop", action="store_true", help="Repete o pedido a cada 60 segundos.")
    args = parser.parse_args()
    while True:
        print(pedir(PEDIDO))
        if not args.loop:
            return
        print("--- esperando 60 s ---")
        time.sleep(60)


if __name__ == "__main__":
    main()
