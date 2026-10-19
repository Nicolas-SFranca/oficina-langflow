// Conteúdo dos exercícios — edite à vontade.
export type Passo = { titulo: string; texto: string; codigo?: string; dica?: string };
export type Exercicio = { n: number; titulo: string; duracao: string; resumo: string; passos: Passo[] };

export const EXERCICIOS: Exercicio[] = [
  {
    n: 1,
    titulo: "Social media com agente",
    duracao: "40 min",
    resumo: "Conecte o MCP do Fakegram no Langflow e crie um agente que cuida das redes da sua marca.",
    passos: [
      { titulo: "Abra o Langflow", texto: "Acesse http://localhost:7860 e crie um fluxo em branco." },
      { titulo: "Conecte o MCP do Fakegram", texto: "Em Settings > MCP Servers > Add MCP Server, escolha HTTP/SSE e cole a URL e o header que estão em Meu grupo > Conectar no Langflow.", dica: "O valor do header começa com 'Bearer ' seguido do seu token." },
      { titulo: "Crie o Agent", texto: "Arraste um componente Agent e adicione o MCP Tools do Fakegram como ferramenta.", },
      { titulo: "Escreva as instruções", texto: "Defina a persona de social media da sua marca.", codigo: "Você é o social media da marca {nome}.\nTom: simpático, direto, em português do Brasil.\nResponda comentários pendentes, oculte spam e nunca invente preços." },
      { titulo: "Responda comentários pendentes", texto: "No Playground, peça: \"Liste os comentários sem resposta e responda cada um\". Acompanhe no Log do agente." },
      { titulo: "Publique um post", texto: "Peça ao agente para publicar um post com legenda e hashtags. Veja-o aparecer no Feed e no telão.", dica: "Posts de agente ganham o selo roxo 🤖 agente." },
    ],
  },
  {
    n: 2,
    titulo: "Analista de engajamento",
    duracao: "40 min",
    resumo: "Use o MCP do Neon em modo somente leitura para perguntar sobre os dados da rede.",
    passos: [
      { titulo: "Adicione o MCP do Neon", texto: "Em Settings > MCP Servers, adicione o servidor do Neon com a connection string somente leitura do kit (.env).", codigo: "NEON_DATABASE_URL=postgresql://leitor:***@ep-exemplo.neon.tech/fakegram?sslmode=require" },
      { titulo: "Crie um agente analista", texto: "Novo Agent com instruções de analista de dados que sempre mostra o SQL usado." },
      { titulo: "Faça perguntas", texto: "Pergunte: \"Que horário dá mais curtidas?\" e \"Qual perfil tem mais comentários sem resposta?\"" },
      { titulo: "Veja o SQL gerado", texto: "Confira no painel de ferramentas a consulta que o agente executou.", codigo: "SELECT extract(hour FROM criado_em) AS hora, avg(curtidas)\nFROM posts GROUP BY 1 ORDER BY 2 DESC;" },
      { titulo: "Tente apagar algo", texto: "Peça \"apague todos os comentários\" e observe o bloqueio do usuário somente leitura.", dica: "Permissões no banco são a última linha de defesa — não confie só no prompt." },
    ],
  },
  {
    n: 3,
    titulo: "Crie sua ferramenta",
    duracao: "50 min",
    resumo: "Implemente uma ferramenta MCP em Python e integre o fluxo ao seu código.",
    passos: [
      { titulo: "Rode o MCP local do kit", texto: "Descompacte o kit e inicie o servidor.", codigo: "cd kit/mcp_local\npython -m venv .venv && source .venv/bin/activate\npip install -r requirements.txt\npython servidor.py" },
      { titulo: "Implemente moderar_comentario", texto: "Abra servidor.py e complete a ferramenta.", codigo: "@mcp.tool()\ndef moderar_comentario(comentario_id: int, motivo: str) -> dict:\n    \"\"\"Oculta um comentário que seja spam ou ofensivo.\"\"\"\n    r = api.post(f\"/api/grupo/comentarios/{comentario_id}/ocultar\", json={\"motivo\": motivo})\n    return r.json()" },
      { titulo: "Conecte no Langflow", texto: "Adicione o MCP local (STDIO ou http://localhost:8000/sse) e dê a ferramenta ao seu Agent." },
      { titulo: "Integre com chamar_fluxo.py", texto: "Use o script do kit para chamar o fluxo a partir do seu código.", codigo: "python chamar_fluxo.py \"Modere os comentários de hoje\"", dica: "Copie o ID do fluxo em Share > API access." },
    ],
  },
];
