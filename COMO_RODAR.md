# Como rodar o Fakegram em casa

Este é o código completo da plataforma da oficina: a API com o servidor MCP e o site. Dá para rodar só o site, com dados de mentira, ou tudo, com um banco seu.

| Pasta | O que tem |
|---|---|
| `app/` | API em FastAPI e o servidor MCP (`app/mcp_servidor.py`) que o agente do exercício 2 usou |
| `FakeGram/` | O site: feed, telão, ranking, slides da aula e páginas dos exercícios (React e TanStack Start) |
| `migrations/` e `scripts/` | O banco: tabelas, usuário só de leitura e dados de exemplo |
| `tests/` | Testes da API |
| `kit_template/` e `gabarito/` | O que vira o kit de cada grupo e o kit de estudo |

## 1. Só o site, sem banco

Precisa do Node.js 22.12 ou mais novo (ou 20.19, na linha 20).

1. Em `FakeGram/src/config.ts`, deixe `API_URL = ""`. Com o endereço vazio, o site roda em modo demonstração, com dados falsos na memória, que voltam ao início quando a página recarrega. A chave do `/admin` nesse modo é `oficina`.
2. Na pasta `FakeGram`:

   ```powershell
   npm install
   npm run dev
   ```

3. Abra http://localhost:8080.

## 2. API, MCP e site, com o seu banco

Precisa do Python 3.11 ou mais novo e de um banco Postgres. O Neon tem plano gratuito: crie um projeto e copie a connection string.

1. Na pasta do projeto, no PowerShell (no macOS ou no Linux, troque `.venv\Scripts\python` por `.venv/bin/python`):

   ```powershell
   python -m venv .venv
   .venv\Scripts\python -m pip install -r requirements.txt
   copy .env.example .env
   ```

2. No `.env`, preencha `DATABASE_URL`, `ADMIN_KEY` e `ALUNO_LEITURA_SENHA`. O próprio arquivo diz como gerar as chaves. Nunca publique o `.env`.
3. Crie as tabelas e os dados de exemplo. O `seed.py` imprime os tokens dos 6 grupos: guarde.

   ```powershell
   .venv\Scripts\python scripts\migrar.py
   .venv\Scripts\python scripts\seed.py
   ```

4. Suba a API e abra http://localhost:8000/docs:

   ```powershell
   .venv\Scripts\python -m uvicorn app.main:app --reload
   ```

5. Em `FakeGram/src/config.ts`, use `API_URL = "http://localhost:8000"` e rode o site como na parte 1.
6. No Langflow, inclua o servidor MCP `http://localhost:8000/mcp` com o header `Authorization: Bearer <token de um grupo>`.

## 3. Testes

- Site, na pasta `FakeGram`: `npm test` e `npm run lint`.
- API: crie uma branch do banco só para testes no Neon, coloque a URL dela em `TEST_DATABASE_URL` no `.env` e rode `.venv\Scripts\python -m pytest`. Os testes recusam rodar no mesmo banco do `DATABASE_URL`.

## 4. Por onde começar a ler

- `app/mcp_servidor.py`: as 8 ferramentas do MCP. Repare nas docstrings, que são o que o modelo lê.
- `app/dependencias.py` e `app/servicos/limites.py`: token do grupo, pausa do instrutor e limite de ações por minuto.
- `app/servicos/seed.py`: como a fila de comentários e a injeção de prompt são plantadas.
- `FakeGram/src/content/aula.ts`: todos os slides da aula, em dados.

O `README.md` tem mais detalhes do banco e de como publicar na Vercel.
