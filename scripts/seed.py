"""Recria os dados de exemplo e imprime as contagens e os tokens dos grupos."""

import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO)

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import abrir_pool, fechar_pool
from app.servicos.seed import recriar_dados


def main() -> None:
    abrir_pool()
    try:
        resumo = recriar_dados()
    finally:
        fechar_pool()

    print(f"perfis: {resumo['perfis']}")
    print(f"posts: {resumo['posts']}")
    print(f"curtidas: {resumo['curtidas']}")
    print(f"comentarios: {resumo['comentarios']}")
    print(f"gabarito_comentarios: {resumo['gabarito_comentarios']}")
    print(f"acoes_agente: {resumo['acoes_agente']}")
    print(f"grupos: {len(resumo['grupos'])}")
    print()
    for grupo in resumo["grupos"]:
        print(f"{grupo['nome']} @{grupo['handle']} {grupo['token']}")


if __name__ == "__main__":
    main()
