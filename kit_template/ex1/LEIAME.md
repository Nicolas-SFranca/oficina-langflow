# Exercício 1 · Primeiro agente

Aqui vocês aprendem a interface do Langflow montando dois fluxos. Nada do Fakegram ainda: só o modelo e algumas ferramentas.

## Parte A · Fluxo simples (9 min)

1. Crie um projeto e escolha **Fluxo em branco**.
2. Na barra da esquerda, em **Componentes**:
   - **Entrada e saída**: arraste **Campo de entrada de bate-papo** e **Saída do chat**.
   - **Modelos e Agentes**: arraste **Modelo de linguagem** e **Modelo de prompt**.
3. No **Modelo de linguagem**, escolha o provedor e o modelo que o instrutor indicar. Com Google, use `gemini-flash-latest`.
4. No **Modelo de prompt**, escreva:

   ```text
   Você é monitor de Sistemas de Informação.
   Responda em português, em no máximo 5 linhas, sempre com um exemplo do dia a dia.
   Tom: {tom}.
   ```

   O `{tom}` vira um campo novo no componente. Preencha com `bem-humorado`.
5. Ligue as portas:
   - **Campo de entrada de bate-papo** → entrada **Entrada** do Modelo de linguagem.
   - **Modelo de prompt** → entrada **Mensagem do sistema** do Modelo de linguagem.
   - **Resposta modelo** do Modelo de linguagem → **Saída do chat**.
6. Abra o **Playground** e pergunte: "O que é uma chave estrangeira?"
7. Troque o tom para `formal` e pergunte de novo.

**Deu certo se:** a resposta muda de tom sem você reescrever o prompt.

## Parte B · Vira agente (10 min)

1. Apague o Modelo de linguagem e o Modelo de prompt. Arraste um **Agente** (Modelos e Agentes) e escolha o mesmo modelo.
2. Arraste as ferramentas:
   - **Calculadora** e **Data atual**, em **Utilitários**.
   - **Procurar na web** e **URL**, em **Origens de dados**.
3. Em cada uma, ligue o **Tool Mode**. A saída vira **Conjunto de ferramentas**: ligue na entrada **Ferramentas** do Agente.
4. Ligue **Campo de entrada de bate-papo** → **Entrada** do Agente e **Resposta** do Agente → **Saída do chat**.
5. Em **Instruções para o agente**, cole:

   ```text
   Você é um assistente de estudos de Sistemas de Informação.
   Use a calculadora para qualquer conta, mesmo simples.
   Para fatos recentes, pesquise na web e cite o link da fonte.
   Responda em português.
   ```

6. No Playground, teste um de cada vez:
   - "Quanto é 17% de 2.349?"
   - "Que dia é hoje e quantos dias faltam para o Natal?"
   - "Qual é a versão mais recente do Langflow? Me dê a fonte."
7. Abra a **Atividade de fluxo** (ícone de pulso na barra da esquerda) e veja cada chamada de ferramenta.

**Deu certo se:** o agente chamou uma ferramenta que você não mandou ele chamar. Na pergunta da data, ninguém falou em Current Date.

## Deu erro?

| Sintoma | O que fazer |
|---|---|
| Nenhuma resposta ou erro de autenticação | Confira a chave e o modelo no componente |
| Componente com aviso amarelo | Passe o mouse no aviso: falta um campo |
| A ferramenta não aparece no Agente | Ligue o Tool Mode da ferramenta |
| O agente responde sem usar ferramenta | Reforce nas Instruções para o agente |
| Erro 429 ou "quota" | Espere 1 minuto ou use `gemini-flash-lite-latest` |

## Para ir além

- Pergunte no Playground "qual foi a minha primeira pergunta?". Depois abra uma sessão nova e pergunte de novo. É a memória de curto prazo.
- Troque o modelo e compare as respostas e o tempo.
