"""Pool de conexões com o Postgres. As consultas devolvem dicionários."""

import logging
from collections.abc import Iterator
from contextlib import contextmanager

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import config
from app.erros import ErroAPI

log = logging.getLogger("fakegram")

pool: ConnectionPool | None = None


def abrir_pool() -> None:
    """Cria o pool no início da API. Se o banco estiver fora, a API continua no ar."""
    global pool
    try:
        pool = ConnectionPool(
            conninfo=config.database_url,
            min_size=1,
            max_size=5,
            timeout=30,
            open=False,
            kwargs={"row_factory": dict_row, "connect_timeout": 30},
        )
        pool.open(wait=True, timeout=30)
    except Exception as erro:
        log.warning("Não consegui abrir o banco: %s", erro)
        if pool is not None:
            pool.close()
        pool = None


def fechar_pool() -> None:
    global pool
    if pool is not None:
        pool.close()
        pool = None


def _exigir_pool() -> ConnectionPool:
    if pool is None:
        raise ErroAPI(503, "Banco indisponível")
    return pool


def consultar(sql: str, parametros: tuple | dict | None = None) -> list[dict]:
    """Executa o SQL e devolve as linhas como dicionários.

    Ao sair do `with` sem erro, a transação é confirmada.
    Isso vale também para INSERT e UPDATE.
    """
    with _exigir_pool().connection() as conexao:
        with conexao.cursor() as cursor:
            if parametros is None:
                cursor.execute(sql)
            else:
                cursor.execute(sql, parametros)
            if cursor.description is None:
                return []
            return list(cursor.fetchall())


def consultar_um(sql: str, parametros: tuple | dict | None = None) -> dict | None:
    linhas = consultar(sql, parametros)
    return linhas[0] if linhas else None


@contextmanager
def transacao() -> Iterator:
    """Abre uma transação. Várias escritas do mesmo pedido confirmam juntas."""
    with _exigir_pool().connection() as conexao:
        with conexao.cursor() as cursor:
            yield cursor
