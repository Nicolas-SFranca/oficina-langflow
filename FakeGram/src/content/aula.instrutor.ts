// Notas de palco do instrutor, pelo título do slide. O site NÃO importa este arquivo:
// elas vão só para o roteiro em HTML (FakeGram/scripts/roteiro-instrutor.ts).
export const NOTAS_DO_INSTRUTOR: Record<string, string> = {
  "Antes de tudo: instale o Langflow":
    "A instalação é o maior ladrão de tempo de oficina. Quem não conseguir instalar faz em dupla. Ninguém fica parado.",
  "Tem um agente trabalhando agora":
    "Ouça duas respostas e não corrija: a resposta, uma ferramenta, aparece no slide 'Ferramenta = nome + descrição + parâmetros'. Às 18:55, deixe o agente do grupo Instrutor rodando com `.venv\\Scripts\\python ex3\\chamar_fluxo.py --loop` e pare com Ctrl+C logo depois deste slide, para não gastar a cota da sua chave.",
  "Mãos ao alto":
    "Use as respostas para calibrar. Se muita gente levantou na 4, acelere o começo do bloco de MCP. Se ninguém levantou na 2, explique Claude Code numa frase quando ele aparecer.",
  "O mapa da aula":
    "Formar os grupos (3 a 4 pessoas) e entregar os tokens agora. Assim a Prática 2 não começa com fila.",
  "Tokens: a moeda da IA":
    "A resposta da pergunta vem no slide do ciclo do agente. Os preços mudam: atualize a tabela pela lista de modelos do Langflow antes da aula.",
  "Langflow em uma frase":
    "A partir daqui todo mundo com o Langflow aberto: o tour é feito junto, clicando. Os slides são só apoio.",
  "A barra lateral": "Confirme no ensaio o nome e a função do ícone de relógio (4).",
  "Configurar o modelo":
    "Não avance enquanto houver mais de 3 pessoas sem chave: quem está sem chave faz em dupla com quem tem; se forem muitos, use a sua chave de reserva. Confirme no ensaio o caminho exato da tela de provedores.",
  "Prática 1 · Primeiro agente": "Inicie o cronômetro de 20 minutos no painel.",
  "Parte A · Fluxo simples (9 min)":
    "Circule pela sala. Os erros mais comuns: linha na porta errada (Input × System Message) e modelo sem chave.",
  "Parte B · Vira agente (10 min)": "Teste o Procurar na web no Wi-Fi do local antes da aula.",
  "Deu erro? E agora?":
    "Pode deixar este slide aberto durante a prática, antes de fechar com a pergunta.",
  "MCP no mundo real": "Antes da aula, confira a especificação atual em modelcontextprotocol.io.",
  "Prática 2 · O agente da marca": "Inicie o cronômetro de 28 minutos no painel.",
  "Conectar (8 min)":
    'Circule pela sala. Erro número um: esquecer o espaço depois de "Bearer". Número dois: token de outro grupo. Confirme no ensaio o nome da aba HTTP.',
  "Pedidos em escada (17 min)":
    'Min ~77: `POST /api/admin/simular` com quantidade 20 ("Chegou movimento!"). Min ~83: pausar os agentes por 30 segundos e mostrar o 423 ("Botão vermelho."), depois despausar.',
  "Telão e ranking": "Leia duas respostas em voz alta: uma boa e uma que inventou algo.",
  "Os tipos de RAG": "Passe rápido: o detalhe de cada tipo está no material de estudo.",
  "Bônus · O manual da marca":
    "Se sobrar 1 minuto, mostre com o manual da cafeteria. Precisa de um modelo de embeddings (Google Generative AI Embeddings, mesma chave). Se o tempo apertar, só mostre o slide.",
  Intervalo: "Inicie o cronômetro de 5 minutos no painel.",
  "Prática 3 · Construa a ferramenta que faltou": "Inicie o cronômetro de 30 minutos no painel.",
  "Três níveis (21 min)":
    "Aos 10 minutos, projete a solução do TODO 1, só a função. Se muita gente travar no nível 1, faça ele junto com a turma.",
  "A descrição é o produto":
    "Use durante a prática, quando alguém reclamar que o agente não chama a ferramenta.",
  "Travou? E agora?": "Pode deixar este slide aberto durante a prática.",
  "Peça para o seu agente de código": "É o caminho do nível 3 e o que eles levam para casa.",
  "Ranking final": "Pause os agentes pelo admin antes de anunciar.",
  "Quiz relâmpago": 'Aperte R (ou "Revelar" no painel) para mostrar as respostas.',
  "Para estudar depois":
    "Diga até quando o FakeGram fica no ar e libere o kit de estudo pelo admin.",
  "Obrigado!":
    "Depois da aula: revogar os tokens dos grupos pelo admin e a chave reserva do Gemini.",
};
