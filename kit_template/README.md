# Kit do Fakegram · {{GRUPO}} (@{{PERFIL}})

Este zip é o material do seu grupo. O `.env` já traz o endereço da API, o endereço do MCP e o token de vocês. Não publiquem esse token.

## Pastas

- `ex1/`: o primeiro agente. Um fluxo simples e depois um Agente com ferramentas. Não usa o Fakegram.
- `ex2/`: o agente de social media, ligado ao MCP do Fakegram com o token do grupo.
- `ex3/`: um MCP escrito por vocês, rodando na própria máquina, em três níveis.
- `bonus/analista/`: um agente que consulta o banco só para leitura e procura padrões de engajamento.
- `bonus/rag/`: um chatbot que responde com base no manual da marca, para o agente parar de inventar horário e preço. Traz o fluxo pronto `rag-simples.json` para importar no Langflow.
- `RECOMENDACOES.md`: como criar e configurar agentes, MCP e RAG, com as fontes de cada dica.
- `DESAFIOS.md`: oito desafios para continuar depois da aula, a maioria sem depender do Fakegram.
- `.env.example`: o modelo do `.env`, com o que vai em cada linha.
- `projeto/`: só no kit de estudo. O código completo do Fakegram, com a API, o MCP e o site. Comece por `projeto/COMO_RODAR.md`.

## Antes de começar

1. Langflow Desktop aberto, com o Gemini configurado com a chave gratuita de vocês (passo a passo na página /preparar do Fakegram).
2. Python 3.11 ou mais novo. Só o `ex3/` precisa.

Para o `ex3/`, na pasta deste kit, no PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

Não é preciso ativar o venv. Chamar `.venv\Scripts\python` já usa as bibliotecas dele e evita o erro de política de execução do PowerShell.

No macOS ou no Linux, troque `.venv\Scripts\python` por `.venv/bin/python`.

## Nomes dos componentes

Os guias usam os nomes do Langflow em português. Se o de vocês estiver em inglês, use a coluna da direita. O idioma muda em Configurações, pela foto do perfil.

| Português | Inglês |
|---|---|
| Campo de entrada de bate-papo | Chat Input |
| Saída do chat | Chat Output |
| Modelo de linguagem | Language Model |
| Modelo de prompt | Prompt Template |
| Agente | Agent |
| Instruções para o agente | Agent Instructions |
| Ferramentas MCP | MCP Tools |
| Conjunto de ferramentas | Toolset |
| Calculadora · Data atual | Calculator · Current Date |
| Procurar na web | Web Search |
| base de dados de conhecimento | Knowledge Base |
| Contribuição humana | Human Input |
