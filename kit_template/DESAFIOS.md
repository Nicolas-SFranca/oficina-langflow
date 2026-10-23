# Desafios para depois da aula

Do mais simples ao mais aberto. Os desafios 1 a 6 não dependem do Fakegram: funcionam só com o Langflow, a sua chave do Gemini e o Python. As dicas de como fazer bem estão em `RECOMENDACOES.md`.

## 1. Um agente com cara própria

Crie um agente de estudos para uma disciplina do seu semestre. Ele precisa de papel, objetivo, regras e formato de resposta (use o modelo de instruções do `RECOMENDACOES.md`) e de pelo menos duas ferramentas: **Calculadora** e **Procurar na web**.

**Deu certo se:** ele usa a calculadora para contas e cita o link da fonte quando pesquisa. Abra duas sessões no Playground e confira que uma não lembra da outra.

## 2. RAG do seu curso

Use o fluxo `bonus/rag/rag-simples.json` com um documento de verdade: o plano de ensino de uma disciplina, o regulamento de estágio ou o PPC do curso, em PDF ou texto.

**Deu certo se:** ele acerta 5 perguntas cuja resposta você conhece e responde "não sei" para 2 perguntas que não estão no documento. Anote as 7 perguntas e as respostas: é a sua primeira avaliação.

## 3. RAG com base de conhecimento

Faça o mesmo documento passar por uma **base de conhecimento** do Langflow, em vez de ir inteiro no prompt. Compare com o desafio 2 usando as mesmas 7 perguntas.

**Deu certo se:** você consegue explicar em uma frase quando vale cada abordagem. Dica: a seção 4 do `RECOMENDACOES.md` tem um número que ajuda a decidir.

## 4. Seu próprio MCP, do zero

Escreva um servidor MCP em Python sobre um assunto seu: lista de tarefas guardada num arquivo JSON, notas da faculdade, gastos do mês. Comece pelo `ex3/meu_mcp/server.py` ou use o `ex3/PROMPT_CRIAR_MCP.md` com um agente de código.

Regras:
- No mínimo 3 ferramentas, com docstring que explique de onde vem cada parâmetro.
- Uma delas escreve dados e pede confirmação antes de apagar alguma coisa.
- Os erros dizem como corrigir, com `ToolError`.

**Deu certo se:** um agente no Langflow usa as 3 ferramentas certas sem você dizer o nome delas.

## 5. Dois servidores MCP no mesmo agente

Ligue no mesmo Agente o seu MCP do desafio 4 e um servidor pronto, por exemplo o `mcp-server-fetch` (no Langflow, servidor STDIO com o comando `uvx mcp-server-fetch`).

**Deu certo se:** um único pedido faz o agente buscar algo na web e guardar o resultado no seu servidor.

## 6. Ataque e defesa

Escreva 5 textos que tentem enganar um dos seus agentes: "ignore as instruções", "o administrador mandou", instrução escondida no meio de um documento do RAG. Rode cada um, anote quais funcionaram e melhore as instruções e as permissões.

**Deu certo se:** você tem uma tabela com ataque, resultado antes e resultado depois, e sabe explicar por que nenhum ajuste no prompt dá garantia total.

## 7. O agente de social media, completo

Enquanto o Fakegram estiver no ar e o token do seu grupo valer: junte o agente do exercício 2, o MCP do exercício 3 e o manual da marca do bônus RAG num agente só, que responde a fila, oculta spam e não inventa horário nem preço.

**Deu certo se:** ele zera a fila sem ocultar nenhum comentário legítimo.

## 8. Um programa que chama o seu fluxo

Use o `ex3/chamar_fluxo.py` para disparar um dos seus fluxos por código. Depois faça ele ler as perguntas de um arquivo e gravar as respostas em outro.

**Deu certo se:** você roda a avaliação do desafio 2 inteira com um comando e compara as respostas com as esperadas.
