"""Rotas do instrutor. Exigem o header X-Admin-Key. Ainda sem regras."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/admin", tags=["admin"])
