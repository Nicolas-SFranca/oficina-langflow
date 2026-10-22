# Prompt para o seu agente de código criar um MCP

Cole no Claude Code, no Cursor ou em outro agente de código. Troque o que está entre colchetes. Vocês decidem o objetivo, as ferramentas e as regras; o agente escreve o código.

```text
Quero criar um servidor MCP em Python para [OBJETIVO EM UMA FRASE].

Contexto:
- Vou usar no Langflow pelo transporte Streamable HTTP, em http://localhost:8001/mcp.
- Use o SDK oficial `mcp` (versão 2, classe MCPServer) e httpx para chamar APIs.

Ferramentas de que preciso:
1. [nome_da_ferramenta]: o que faz, parâmetros com tipo, o que devolve.
2. [...]

Regras:
- Cada ferramenta com docstring em português dizendo quando usar, o que cada
  parâmetro significa e o que volta. O modelo escolhe a ferramenta pela docstring.
- Separe ferramentas de leitura das que alteram dados. As que alteram dizem
  isso na docstring.
- Segredos só pelo .env (python-dotenv). Nunca no código.
- Em erro da API, devolva {"erro": "mensagem"} em vez de lançar exceção.
- Inclua um README com como rodar e um script que lista as ferramentas.

Antes de escrever o código, me mostre a lista de ferramentas com as assinaturas
e espere eu aprovar.
```

## Dicas

- A última linha é a mais importante: peça o plano antes do código. Quem decide a arquitetura são vocês.
- Comece com duas ou três ferramentas. Cada ferramenta a mais é texto a mais no contexto do modelo, em toda chamada.
- Ferramenta que altera dados (apagar, enviar, pagar) merece aprovação humana no fluxo. No Langflow, o componente **Contribuição humana** (Human Input) pausa o fluxo e espera Aprovar ou Rejeitar.
- Para testar o servidor sem o Langflow, peça um script que conecte, liste as ferramentas e chame uma delas.
