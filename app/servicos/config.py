"""Lê e grava os ajustes do instrutor na tabela config: pausado e estudo_liberado."""

from app.db import consultar, consultar_um


def _ler(chave: str) -> bool:
    linha = consultar_um("SELECT valor FROM config WHERE chave = %s", (chave,))
    if linha is None:
        return False
    return linha["valor"].strip().lower() == "true"


def _gravar(chave: str, ligado: bool) -> bool:
    consultar(
        """
        INSERT INTO config (chave, valor) VALUES (%s, %s)
        ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor
        """,
        (chave, "true" if ligado else "false"),
    )
    return ligado


def esta_pausado() -> bool:
    return _ler("pausado")


def definir_pausado(pausado: bool) -> bool:
    return _gravar("pausado", pausado)


def estudo_liberado() -> bool:
    """O kit de estudo, com os gabaritos, só sai depois que o instrutor libera."""
    return _ler("estudo_liberado")


def definir_estudo_liberado(liberado: bool) -> bool:
    return _gravar("estudo_liberado", liberado)
