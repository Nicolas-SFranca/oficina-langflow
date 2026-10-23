# Bônus · O manual da marca (RAG)

No exercício 2, o agente às vezes inventa horário, preço ou prazo. Ele não leu nada sobre a marca: quando não sabe, chuta. Aqui vocês dão a ele o manual da marca, e ele passa a responder com base no documento.

A pasta `manuais/` tem o manual de cada marca do Fakegram. O de vocês é `manuais/{{PERFIL}}.md`. Os manuais são fictícios, feitos para a oficina.

## Caminho 1 · Fluxo pronto: o manual inteiro no prompt

1. No Langflow, importe `bonus/rag/rag-simples.json`: na tela de projetos, use o botão de enviar fluxo ou arraste o arquivo para a lista.
2. No componente **Manual da marca**, carregue `manuais/{{PERFIL}}.md`.
3. No **Agente**, escolha Google e `gemini-flash-latest`.
4. No Playground, pergunte:
   - "Vocês abrem domingo?"
   - "Aceitam cartão?"
   - "Quanto tempo demora?"

**Deu certo se:** a resposta bate com o manual e diz de qual seção veio. Pergunte algo que não está no manual e veja se ele admite que não sabe.

O manual é pequeno, então cabe inteiro no prompt e não precisa de busca. Para documento grande, use o caminho 2. A seção 4 do `RECOMENDACOES.md` explica quando vale cada um.

## Caminho 2 · Base de conhecimento

Aqui o Langflow parte o manual em pedaços, gera os embeddings e busca só os pedaços parecidos com a pergunta.

1. Crie uma base de conhecimento com o manual da marca e escolha um dos modelos de embedding que o Langflow oferecer para ela.
2. Crie um fluxo a partir do modelo **Vector Store RAG**. No Langflow 1.12 ele já usa a base de conhecimento: escolha a sua base no componente de conhecimento.
3. No **Agente**, escolha o modelo e faça as mesmas perguntas do caminho 1.

**Deu certo se:** as respostas batem com as do caminho 1. Compare também o tempo de resposta.

## Caminho 3 · O agente do exercício 2 consulta o manual

É o RAG agêntico: a busca vira uma ferramenta, e o agente decide quando usar.

1. Crie uma base de conhecimento com o manual da marca. Ela aparece no componente **base de dados de conhecimento** (em **Arquivos e Conhecimento**).
2. No fluxo do exercício 2, arraste o componente **base de dados de conhecimento**, escolha a base, ligue o **Tool Mode** e conecte na entrada **Ferramentas** do Agente.
3. Acrescente nas instruções do agente:

   ```text
   Antes de responder sobre horário, preço, pagamento, prazo ou reserva, consulte a base de conhecimento da marca.
   Se a informação não estiver lá, diga que vai confirmar com a equipe.
   ```

4. Peça: "Veja a fila e responda as dúvidas."

**Deu certo se:** na Atividade de fluxo aparece a consulta à base antes de cada resposta sobre horário ou pagamento.

## Para pensar

- Por que perguntar "quantas curtidas teve terça?" para este RAG é usar a ferramenta errada? (Dica: isso é SQL, do bônus analista.)
- O que acontece se o manual tiver uma informação velha? Quem é o dono da verdade: o documento ou o agente?
