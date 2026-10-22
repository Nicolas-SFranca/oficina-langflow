# Exercício 3 · O MCP de vocês

O servidor do Fakegram não tem uma ferramenta para ocultar comentários. Neste exercício vocês sobem um segundo servidor MCP, na própria máquina, e dão essa ferramenta ao agente.

São três níveis. Todo mundo chega no 1. O 2 vale ponto no ranking. O 3 é para quem quer ir além.

## Preparar (uma vez)

Na pasta do kit, no PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

Não precisa ativar o venv. No macOS ou no Linux, troque `.venv\Scripts\python` por `.venv/bin/python`.

## Nível 1 · Rodar e conectar

1. Na pasta do kit:

   ```powershell
   .venv\Scripts\python ex3\meu_mcp\server.py
   ```

   Ele escuta em `http://localhost:8001/mcp` e já manda o token do `.env` em toda chamada à API. Deixe essa janela aberta.
2. No Langflow, **Servidores MCP** → **Incluir servidor MCP**, opção HTTP, URL `http://localhost:8001/mcp`. No header, use de novo `Authorization: Bearer <TOKEN do .env>`, para ficar igual ao exercício 2.
3. No mesmo Agente do exercício 2, arraste mais um componente **Ferramentas MCP**, escolha este servidor, ligue o **Tool Mode** e conecte na entrada **Ferramentas**.
4. No Playground: "Use o meu_perfil do servidor local e me diga quantos comentários faltam."

**Deu certo se:** a Atividade de fluxo mostra a chamada ao servidor de vocês, e a janela do `server.py` registra o pedido.

## Nível 2 · TODO 1: moderar_comentario

Abra `ex3/meu_mcp/server.py` e escreva a ferramenta `moderar_comentario(comentario_id: int, motivo: str)`:

- Chame `POST /api/grupo/comentarios/{comentario_id}/ocultar` com o JSON `{"motivo": motivo}`, usando a função `pedir`.
- Escreva a docstring: para que serve, de onde vem o `comentario_id` e o que é o `motivo`. A docstring é o texto que o modelo lê para decidir se usa a ferramenta.

Salve, feche o servidor com Ctrl+C e rode de novo. No Langflow, recarregue o servidor MCP para a ferramenta nova aparecer.

No Playground: "Veja a fila do meu perfil e oculte o que for spam ou tentativa de injeção."

**Deu certo se:** o ranking soma +3 para cada spam oculto. Cuidado: ocultar comentário legítimo tira 2 pontos.

## Nível 3 · TODO 2 ou o seu próprio MCP

Escolha um caminho:

- **TODO 2:** `sugerir_hashtags(texto: str) -> list[str]`, sem chamar a API. Separe as palavras, ignore as de menos de 4 letras, não repita e devolva até 5, sem o `#`.
- **Seu próprio MCP:** use o `PROMPT_CRIAR_MCP.md` desta pasta com o Claude Code, o Cursor ou outro agente de código. Vocês decidem o objetivo e as ferramentas; ele escreve o servidor.

## Travou?

| Mensagem | O que fazer |
|---|---|
| `Activate.ps1` não pode ser carregado | Não ative: use `.venv\Scripts\python` direto |
| `ModuleNotFoundError: mcp` | `.venv\Scripts\python -m pip install -r requirements.txt` |
| Confira API_URL e TOKEN no .env do kit | Rode a partir da pasta do kit, onde está o `.env` |
| Porta 8001 em uso | Feche a outra janela do `server.py` |
| A ferramenta nova não aparece | Reinicie o `server.py` e recarregue o servidor no Langflow |

## Depois da aula: chamar o fluxo pelo código

`chamar_fluxo.py` dispara o fluxo do Langflow a partir de um programa.

1. No `.env`, tire o `#` das linhas `LANGFLOW_API_KEY` e `FLOW_ID` e preencha com a chave e o id do fluxo (em **Compartilhar** → **API access**). Não cole chave de modelo de IA.
2. Na pasta do kit:

   ```powershell
   .venv\Scripts\python ex3\chamar_fluxo.py
   .venv\Scripts\python ex3\chamar_fluxo.py --loop
   ```

`--loop` repete a cada 60 segundos o pedido "Responda os comentários pendentes do meu perfil e oculte o spam." É um agente low-code disparado por um programa.
