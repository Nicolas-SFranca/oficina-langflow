"""Lê e grava a chave pausado da tabela config."""

from app.db import consultar, consultar_um


def esta_pausado() -> bool:
    linha = consultar_um("SELECT valor FROM config WHERE chave = 'pausado'")
    if linha is None:
        return False
    return linha["valor"].strip().lower() == "true"


def definir_pausado(pausado: bool) -> bool:
    consultar(
        """
        INSERT INTO config (chave, valor) VALUES ('pausado', %s)
        ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor
        """,
        ("true" if pausado else "false",),
    )
    return pausado
