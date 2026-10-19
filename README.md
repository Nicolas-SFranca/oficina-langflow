# Fakegram API

Backend da oficina de agentes de IA (Langflow e MCP). O contrato das rotas está em `docs/CONTRATO_API.md`.

## Subir localmente

No PowerShell, na pasta deste projeto:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Abra o `.env` e preencha `DATABASE_URL` (Neon) e `ADMIN_KEY`. Não commite esse arquivo.

```powershell
uvicorn app.main:app --reload
```

Abra [http://localhost:8000/docs](http://localhost:8000/docs) para ver as rotas e [http://localhost:8000/api/status](http://localhost:8000/api/status) para checar a API e o banco.

## Vercel

O backend sobe na Vercel no lugar do Render. O `app` em `app/main.py` é o ponto de entrada. As mesmas variáveis do `.env` ficam nas variáveis de ambiente do projeto, nunca no Git. Depois do deploy, `PUBLIC_API_URL` deve ser a URL pública da Vercel, sem barra no final.

No bash, a ativação do venv é `source .venv/bin/activate` e a cópia do exemplo é `cp .env.example .env`.
