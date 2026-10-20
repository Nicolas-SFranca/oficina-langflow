"""Limites em memória: ações por minuto e posts por hora, por grupo."""

import time
from collections import defaultdict, deque
from threading import Lock

from app.config import config
from app.erros import ErroAPI

_trava = Lock()
_acoes: dict[int, deque[float]] = defaultdict(deque)
_posts: dict[int, deque[float]] = defaultdict(deque)


def _consumir(filas: dict[int, deque[float]], grupo_id: int, janela: float, limite: int, mensagem: str) -> None:
    agora = time.monotonic()
    with _trava:
        eventos = filas[grupo_id]
        while eventos and agora - eventos[0] > janela:
            eventos.popleft()
        if len(eventos) >= limite:
            raise ErroAPI(429, mensagem)
        eventos.append(agora)


def consumir_acao(grupo_id: int) -> None:
    _consumir(
        _acoes,
        grupo_id,
        60,
        config.limite_acoes_por_minuto,
        "Limite de ações por minuto atingido",
    )


def consumir_post(grupo_id: int) -> None:
    _consumir(
        _posts,
        grupo_id,
        3600,
        config.limite_posts_por_hora,
        "Limite de posts por hora atingido",
    )


def reiniciar() -> None:
    """Zera os contadores. Os testes usam isso entre um caso e outro."""
    with _trava:
        _acoes.clear()
        _posts.clear()
