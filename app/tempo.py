"""Datas da API em ISO 8601, sempre em UTC."""

from datetime import datetime, timezone


def iso(valor: datetime) -> str:
    if valor.tzinfo is None:
        valor = valor.replace(tzinfo=timezone.utc)
    return valor.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
