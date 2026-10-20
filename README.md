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

Abra [http://localhost:8000/docs](http://localhost:8000/docs) para ver as rotas e [http://localhost:8000/api/status](http://localhost:8000/api/status) para checar a API, o banco e o MCP.

O MCP fica em [http://localhost:8000/mcp](http://localhost:8000/mcp). No Langflow, o header é `Authorization: Bearer <token do grupo>`. Para provar daqui:

```powershell
python scripts/testar_mcp.py <token>
```

## Banco

Com o `DATABASE_URL` preenchido, defina `ALUNO_LEITURA_SENHA` no `.env` e aplique as migrations:

```powershell
python scripts/migrar.py
```

Cada arquivo em `migrations/` roda uma vez. A tabela `schema_migrations` guarda o que já foi aplicado. Rodar de novo só avisa `já aplicada`.

Depois monte `NEON_READONLY_URL` com o usuário `aluno_leitura`, a senha de `ALUNO_LEITURA_SENHA` e o mesmo host do `DATABASE_URL`. Essa URL é a chave de leitura do exercício 2. Esse usuário consegue `SELECT` em `perfis`, `posts`, `comentarios`, `curtidas` e nas views de engajamento. `SELECT` em `grupos` tem de falhar com erro de permissão.

Para recriar os dados de exemplo (8 perfis, 120 posts e 6 grupos):

```powershell
python scripts/seed.py
```

O script apaga posts, comentários, curtidas e grupos e grava de novo. A linha `pausado` de `config` fica. Se os grupos já existiam, os tokens são os mesmos. Guarde os 6 tokens impressos no final: eles não entram no Git.

## Testes

Coloque em `TEST_DATABASE_URL` a connection string da branch `testes`. Os testes aplicam as migrations, recriam os dados e chamam a API. Eles recusam rodar se essa URL for a mesma do `DATABASE_URL`.

```powershell
pip install -r requirements.txt
pytest
```

## Vercel

O backend sobe na Vercel no lugar do Render. O `app` em `app/main.py` é o ponto de entrada. As mesmas variáveis do `.env` ficam nas variáveis de ambiente do projeto, nunca no Git. Depois do deploy, `PUBLIC_API_URL` deve ser a URL pública da Vercel, sem barra no final.

No bash, a ativação do venv é `source .venv/bin/activate` e a cópia do exemplo é `cp .env.example .env`.
