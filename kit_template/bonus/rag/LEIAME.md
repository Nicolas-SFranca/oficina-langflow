# Bônus · O manual da marca (RAG)

No exercício 2, o agente às vezes inventa horário, preço ou prazo. Ele não leu nada sobre a marca: quando não sabe, chuta. Aqui vocês dão a ele o manual da marca, e ele passa a responder com base no documento.

A pasta `manuais/` tem o manual de cada marca do Fakegram. O de vocês é `manuais/{{PERFIL}}.md`. Os manuais são fictícios, feitos para a oficina.

## Caminho 1 · Chatbot com o modelo Vector Store RAG

1. No Langflow, crie um fluxo a partir do modelo **Vector Store RAG**.
2. O modelo tem duas partes:
   - **Ingestão:** lê o arquivo, parte em pedaços e guarda no banco vetorial. No componente de arquivo, carregue o manual da sua marca.
   - **Consulta:** recebe a pergunta, busca os pedaços parecidos e manda para o modelo junto com a pergunta.
3. Nos componentes de embedding, use um modelo do mesmo provedor do resto do fluxo. Com Google, escolha um modelo de embeddings do Google Generative AI. Use **o mesmo** modelo de embedding na ingestão e na consulta.
4. Rode a parte de ingestão uma vez (o botão ▶ do último componente dela).
5. No Playground, pergunte:
   - "Vocês abrem domingo?"
   - "Aceitam cartão?"
   - "Quanto tempo demora?"

**Deu certo se:** a resposta bate com o manual. Pergunte algo que não está no manual e veja se ele admite que não sabe.

## Caminho 2 · O agente do exercício 2 consulta o manual

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
