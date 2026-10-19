"""Rotas do grupo. Exigem Authorization: Bearer <token>. Ainda sem regras."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/grupo", tags=["grupo"])
