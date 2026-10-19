# Fakegram · Passo a passo para construir a aplicação da oficina

**Arquitetura**
- **Frontend**: Lovable (React + Vite + Tailwind). Fica hospedado no próprio Lovable.
- **Backend**: Python com FastAPI + servidor MCP (FastMCP) no mesmo app. Construído no Cursor e hospedado no Render.
- **Banco**: Neon Postgres.
- **Ponte entre os dois**: o arquivo `CONTRATO_API.md`. O Lovable cria as telas com dados falsos no mesmo formato da API, e depois é só apontar para o backend real.

> Por que não Next.js: o Lovable gera React/Vite, e os alunos entendem Python. Com o backend separado em FastAPI, o código que eles vão ler (MCP, rotas, serviços) fica todo em Python.

## Visão geral do fluxo

| # | Etapa | Onde | Tempo aprox. |
|---|---|---|---|
| 0 | Criar contas e o banco | Neon, GitHub, Render | 20 min |
| 1 | Frontend com dados falsos | Lovable | 1–2 h |
| 2 | Estrutura do backend | Cursor | 20 min |
| 3 | Banco: tabelas, views e role de leitura | Cursor + Neon | 30 min |
| 4 | Dados de exemplo (seed) | Cursor | 30 min |
| 5 | API REST completa | Cursor | 1–2 h |
| 6 | Servidor MCP + teste no Langflow | Cursor + Langflow | 1 h |
| 7 | Kit do aluno (zip) + gabarito | Cursor | 1 h |
| 8 | Deploy do backend | Render | 30 min |
| 9 | Ligar o Lovable no backend real | Lovable | 20 min |
| 10 | Fluxos do Langflow e ensaio geral | Langflow | 1 h |

**Dicas para o Cursor**
- Use o modo **Agent**, um prompt por vez.
- Revise o diff e rode o que ele pediu antes de seguir.
- Faça um **commit ao fim de cada etapa**. Se algo quebrar, você volta.
- Deu erro? Cole o traceback inteiro no chat do Cursor e peça: "corrija sem mudar o contrato".

---

## Etapa 0 · Contas e banco

1. **Neon**: crie uma conta ou organização **só para a oficina**. A chave de API do MCP do Neon dá acesso à conta inteira, então é melhor isolar.
   - Crie o projeto `oficina-langflow`.
   - Em **Connect**, copie a connection string **pooled**. Ela será o `DATABASE_URL`.
   - Crie também um **branch** chamado `testes`. O Cursor vai usar esse branch para os testes automáticos, sem sujar os dados da aula.
2. **GitHub**: crie o repositório `oficina-api`, vazio.
3. **Render**: crie a conta e ligue ao GitHub. Ainda não crie o serviço.
4. Gere uma chave de admin e guarde num lugar seguro:
   `python -c "import secrets; print(secrets.token_urlsafe(24))"`

> Nunca cole chaves no Lovable nem no chat do Cursor. Elas ficam só no arquivo `.env` e nas variáveis de ambiente do Render.

---

## Etapa 1 · Lovable (frontend)

### Prompt L1 (cole inteiro)

```
Crie uma aplicação web em português do Brasil chamada "Fakegram · Oficina Langflow".

CONTEXTO
É o portal de apoio de uma oficina de 3 horas sobre agentes de IA (Langflow e MCP) para alunos de Sistemas de Informação. Tem duas partes:
1) Uma rede social fictícia de fotos ("Fakegram"), onde os agentes de IA criados pelos alunos publicam, comentam, curtem e moderam. Cada grupo de alunos administra o perfil de uma marca fictícia.
2) O portal da oficina: guias dos exercícios, painel de cada grupo, downloads do kit, ranking e área do instrutor.

IDENTIDADE VISUAL
- Visual próprio de "laboratório tech", inspirado em redes sociais de fotos, mas SEM usar nome, logo, ícones ou o gradiente do Instagram.
- Tema escuro: fundo grafite (#0F1115), cartões #171A21, bordas sutis. Destaque verde-limão #C6F432. Roxo #7C3AED reservado para tudo que foi feito por agente de IA.
- Tipografia: Space Grotesk nos títulos, Inter no texto, JetBrains Mono em código e tokens.
- Tudo que foi feito por um agente leva um selo roxo "🤖 agente" (posts, comentários, itens de atividade).
- Responsivo (o aluno pode abrir no celular), com estados de carregando, vazio e erro em todas as telas.

DADOS (MUITO IMPORTANTE)
- Ainda não existe backend. Não use Supabase.
- Crie src/config.ts com `export const API_URL = ""`.
- Crie UMA camada de dados em src/lib/api.ts com as funções tipadas abaixo. Se API_URL estiver vazio, retorne dados falsos de src/lib/mock.ts com uma pequena espera simulada. Se estiver preenchido, faça fetch real para `${API_URL}<rota>`.
- Nenhuma tela faz fetch direto: tudo passa por api.ts. Erros da API vêm como { "erro": "mensagem" }: mostre a mensagem num toast.
- Token do grupo: localStorage, chave "fakegram_token", enviado como header "Authorization: Bearer <token>".
- Chave de admin: sessionStorage, chave "fakegram_admin", enviada como header "X-Admin-Key".

TIPOS (src/lib/types.ts)
type PerfilResumo = { id: number; handle: string; nome: string; avatar_url: string };
type Perfil = PerfilResumo & { bio: string; categoria: string; grupo_id: number | null; seguidores: number; total_posts: number };
type Post = { id: number; perfil: PerfilResumo; legenda: string; imagem_url: string; hashtags: string[]; curtidas: number; total_comentarios: number; origem: "seed" | "agente" | "humano"; criado_em: string };
type Comentario = { id: number; post_id: number; autor: string; texto: string; origem: "seed" | "agente" | "simulador"; oculto: boolean; resposta_de_id: number | null; criado_em: string; respostas?: Comentario[] };
type Atividade = { id: number; grupo: string; perfil_handle: string; ferramenta: string; resumo: string; sucesso: boolean; criado_em: string };
type AtividadeDetalhe = Atividade & { parametros: Record<string, unknown>; resultado: string };
type Grupo = { id: number; nome: string; perfil: Perfil; pontos: number; ativo: boolean };
type GrupoMe = Grupo & { mcp_url: string; metricas: { curtidas_recebidas: number; comentarios_sem_resposta: number; posts_hoje: number } };
type RankingItem = { posicao: number; grupo: string; perfil_handle: string; pontos: number; respostas: number; moderacoes_corretas: number; posts: number };
type Status = { api: "ok"; banco: "ok" | "erro"; mcp: "ok" | "erro"; agentes_pausados: boolean; versao: string };

FUNÇÕES DE src/lib/api.ts (rota entre parênteses)
Públicas:
- getStatus() (GET /api/status) -> Status
- getFeed({limite, antes_de, perfil}) (GET /api/feed) -> Post[]
- getPost(id) (GET /api/posts/{id}) -> Post & { comentarios: Comentario[] }
- getPerfis() (GET /api/perfis) -> Perfil[]
- getPerfil(handle) (GET /api/perfis/{handle}) -> Perfil & { posts: Post[] }
- getAtividade(limite) (GET /api/atividade) -> Atividade[]
- getRanking() (GET /api/ranking) -> RankingItem[]
Grupo:
- grupoMe() (GET /api/grupo/me) -> GrupoMe
- grupoLog(limite) (GET /api/grupo/log) -> AtividadeDetalhe[]
- baixarKit() (GET /api/grupo/kit) -> baixa o .zip como arquivo (blob)
Admin:
- adminGrupos() (GET /api/admin/grupos) -> (Grupo & { token: string })[]
- adminCriarGrupo(nome, perfil_id) (POST /api/admin/grupos)
- adminRevogar(id) (POST /api/admin/grupos/{id}/revogar)
- adminPausar(pausado) (POST /api/admin/pausar)
- adminReset() (POST /api/admin/reset)
- adminSimular(quantidade) (POST /api/admin/simular)

DADOS FALSOS (src/lib/mock.ts)
8 perfis de marcas fictícias: @graofino (Grão Fino Café), @atleticabyte (Atlética Byte), @ossintaxe (banda Os Sintaxe), @patasecia (pet shop Patas & Cia), @smashdaesquina (hamburgueria Smash da Esquina), @capitulo7 (sebo Capítulo 7), @bikeurbana (oficina Bike Urbana), @estudiopixel (Estúdio Pixel, design).
10 posts por perfil, imagens https://picsum.photos/seed/{handle}-{n}/800/800, avatares https://picsum.photos/seed/{handle}/200/200.
Comentários variados: elogios, dúvidas ("vocês abrem domingo?"), reclamações ("meu pedido atrasou 1h"), spam ("ganhe 10 mil seguidores grátis: bit.ly/xxx") e alguns respostas de agente.
20 atividades de agentes (ex.: "Grupo 3 respondeu um comentário em @smashdaesquina") e um ranking com 6 grupos.

PÁGINAS
1) "/" Início: título da oficina, frase "Crie agentes de IA que gerenciam as redes de uma marca", 3 cartões dos exercícios (link para /exercicios/1, 2 e 3), atalhos para Feed, Meu grupo e Status. Mini prévia do feed ao vivo.

2) "/feed" Feed: lista central de posts (cartão com avatar, @handle, imagem quadrada, botão de curtir só visual, contagem de curtidas e comentários, legenda, hashtags em verde, "há 5 min"). Filtro por perfil em chips no topo. Barra lateral (desktop) "Ao vivo: agentes trabalhando" com getAtividade. Atualiza a cada 5 s; posts novos entram com animação suave e um aviso "3 novos posts" no topo. Pausar a atualização quando a aba estiver oculta. Clicar no post abre /post/:id em modal.

3) "/post/:id": imagem grande + comentários em árvore (respostas recuadas). Comentário oculto aparece em cinza itálico "[comentário removido pela moderação]". Respostas de agente com selo roxo.

4) "/perfil/:handle": cabeçalho com avatar, nome, bio, categoria, seguidores, total de posts, selo "Gerenciado pelo Grupo X" quando tiver grupo. Grade 3 colunas de posts.

5) "/telao" (para projetor 16:9, sem menu, tela cheia): à esquerda uma grade 3x2 com os posts mais recentes (novos entram animados); à direita "Ao vivo" com as últimas atividades dos agentes em letras grandes e o top 5 do ranking. No rodapé, um QR code para o site (biblioteca qrcode.react) e o relógio. Atualiza a cada 3 s.

6) "/grupo" Meu grupo:
   - Se não houver token: tela de entrada com campo "Token do grupo" (fonte mono) e botão Entrar (valida chamando grupoMe).
   - Logado: cabeçalho com o perfil da marca, nome do grupo, pontos em destaque e botão Sair. Três cartões de métricas.
   - Abas:
     a) "Log do agente": tabela (horário, ferramenta, resumo, sucesso ✓/✗); clicar expande os parâmetros e o resultado em JSON formatado. Atualiza a cada 5 s.
     b) "Conectar no Langflow": passo a passo numerado (Settings > MCP Servers > Add MCP Server > HTTP/SSE), com campos somente leitura e botão copiar para: URL do MCP (mcp_url), nome do header "Authorization" e valor "Bearer <token>".
     c) "Kit": botão grande "Baixar meu kit (.zip)" e lista do que vem nele (fluxos do Langflow, .env pré-configurado, código do MCP local, script de integração em Python).
     d) "Código": snippets com abas curl / Python / JavaScript chamando GET /api/grupo/posts e POST /api/grupo/comentarios/{id}/responder, já com a URL e o token preenchidos; botão copiar.
   - Mostrar o token mascarado (•••• + últimos 4) com botão "mostrar".

7) "/exercicios/:n": página-guia com passos numerados, cada passo com checkbox (salvo no localStorage), blocos de código copiáveis e dicas. Conteúdo inicial (deixe fácil de editar em src/content/exercicios.ts):
   - Exercício 1 "Social media com agente" (40 min): conectar o MCP do Fakegram no Langflow, criar um Agent com instruções de social media da marca, responder comentários pendentes e publicar um post.
   - Exercício 2 "Analista de engajamento" (40 min): conectar o MCP do Neon em modo somente leitura, perguntar sobre os dados ("que horário dá mais curtidas?"), ver o SQL gerado, tentar apagar algo e ver o bloqueio.
   - Exercício 3 "Crie sua ferramenta" (50 min): rodar o MCP local do kit, implementar a ferramenta moderar_comentario em Python, conectar no Langflow e integrar o fluxo ao código com chamar_fluxo.py.

8) "/ranking": tabela com posição, grupo, perfil, pontos, respostas, moderações corretas e posts. Pódio visual para os 3 primeiros. Atualiza a cada 10 s.

9) "/status": cartões com o estado da API, do banco e do MCP (verde ok, vermelho erro) e botão "Testar de novo". Abaixo, um checklist local do aluno com checkboxes salvos no localStorage: Langflow instalado e aberto em http://localhost:7860; chave de IA configurada em Model Providers; Python 3.10+ instalado; kit baixado e descompactado.

10) "/admin" Instrutor:
   - Entrada pedindo a chave de admin.
   - Interruptor grande "Pausar todos os agentes" (vermelho quando pausado), com faixa de aviso no topo do site inteiro quando pausado (use agentes_pausados do getStatus).
   - Tabela de grupos: nome, perfil, token mascarado com botões mostrar/copiar, pontos, ativo, botão "Revogar token".
   - Formulário "Novo grupo": nome + escolher um perfil sem grupo.
   - Botões "Simular atividade (20)" e "Resetar dados" (exige digitar RESET para confirmar).
   - Link para abrir o /telao.

NAVEGAÇÃO
Topo fixo com: Fakegram (logo de texto), Feed, Exercícios, Ranking, Meu grupo, Status. Admin só pelo rodapé discreto.
```

### Prompt L2 (refino, depois de ver o resultado)

```
Revise o app inteiro:
1) Teste todas as rotas no celular e no desktop e corrija quebras de layout.
2) Garanta estados de carregando (skeleton), vazio e erro em todas as listas.
3) No /telao, aumente as fontes para leitura a 5 metros de distância e garanta que nada role na tela.
4) Confirme que nenhuma tela faz fetch fora de src/lib/api.ts e que todas as funções do api.ts existem com os nomes e tipos combinados.
5) Coloque um indicador no rodapé: "modo demonstração (dados falsos)" quando API_URL estiver vazio.
```

### Ao terminar
Em **GitHub > Connect** no Lovable, sincronize o projeto com um repositório `oficina-front`. Assim você tem o código e pode editar também pelo Cursor, se quiser.

---

## Etapa 2 · Cursor: estrutura do backend

1. Clone o `oficina-api` vazio e abra no Cursor.
2. Crie `docs/CONTRATO_API.md` com o conteúdo do arquivo CONTRATO_API.md que acompanha este guia.
3. Crie a regra do projeto em `.cursor/rules/projeto.mdc`:

```
---
description: Regras do backend da oficina Fakegram
alwaysApply: true
---
- Python 3.11+, FastAPI, psycopg 3 com SQL puro (sem ORM), psycopg_pool, pydantic v2, pydantic-settings, SDK oficial `mcp` (FastMCP).
- docs/CONTRATO_API.md é a fonte da verdade: rotas, nomes de campos, erros e regras devem bater exatamente.
- Código, nomes e comentários em português, simples e didáticos: alunos de Sistemas de Informação vão ler este código.
- Nunca coloque segredos no código. Tudo vem do .env. Nunca commitar .env.
- Regras de negócio ficam em app/servicos/. Rotas REST e ferramentas MCP só chamam os serviços, sem duplicar lógica.
- Toda ação de grupo (REST ou MCP) grava em acoes_agente.
- Erros sempre no formato {"erro": "mensagem"}.
```

### Prompt C1 · Estrutura

```
Leia docs/CONTRATO_API.md e .cursor/rules/projeto.mdc. Crie a estrutura do backend, sem implementar as regras ainda:

- app/main.py (FastAPI, título "Fakegram API", handler que converte HTTPException e erros de validação para {"erro": "..."})
- app/config.py (pydantic-settings lendo .env: DATABASE_URL, ADMIN_KEY, CORS_ORIGINS, PUBLIC_API_URL, NEON_READONLY_URL, LIMITE_ACOES_POR_MINUTO=30, LIMITE_POSTS_POR_HORA=5)
- app/db.py (pool psycopg_pool aberto/fechado no lifespan do FastAPI; helper para executar consultas e devolver dicts)
- pastas: app/servicos/, app/rotas/ (publico.py, grupo.py, admin.py), app/mcp_servidor.py (vazio), migrations/, scripts/, tests/, kit_template/, gabarito/
- requirements.txt, .env.example (todas as variáveis com comentário explicando cada uma), .gitignore (inclui .env e .venv), README.md com: criar venv, instalar, copiar .env.example para .env, rodar `uvicorn app.main:app --reload`, abrir /docs.
- GET /api/status funcionando: faz SELECT 1 no banco e retorna o formato Status do contrato (mcp: "erro" por enquanto).
```

**Depois do C1, você faz:**
1. `cp .env.example .env`
2. Coloque no `.env` o `DATABASE_URL` do Neon e o `ADMIN_KEY` que você gerou.
3. Rode o servidor e abra `http://localhost:8000/api/status`. O banco deve aparecer como "ok".
4. Faça o commit.

---

## Etapa 3 · Banco

### Prompt C2 · Tabelas, views e role de leitura

```
Crie o banco conforme a seção "Banco" do contrato:

1) migrations/001_schema.sql
   - Tabelas: perfis, grupos (token único, ativo, perfil_id único), posts (hashtags text[], origem com CHECK), comentarios (resposta_de_id auto-referência, oculto, origem), curtidas (post_id, autor, grupo_id nulo quando não for de grupo, criado_em; único por post+autor), acoes_agente (grupo_id, ferramenta, parametros jsonb, resultado text, sucesso, pontos, criado_em), gabarito_comentarios (comentario_id PK/FK, tipo com CHECK), config (chave PK, valor).
   - CHECKs de tamanho (resposta até 500, legenda até 1000), FKs com ON DELETE CASCADE, índices em criado_em, post_id e perfil_id.
   - Views:
     vw_engajamento_posts (post_id, perfil, legenda, criado_em, hora_publicacao, dia_semana em português, qtd_hashtags, tem_pergunta (legenda contém "?"), curtidas, comentarios)
     vw_engajamento_por_hora (hora, posts, media_curtidas, media_comentarios)
     vw_engajamento_por_dia_semana (dia_semana, posts, media_curtidas, media_comentarios)
   - Comente cada tabela com COMMENT ON TABLE/COLUMN em português: o agente do exercício 2 vai ler esses comentários para entender o banco.

2) migrations/002_aluno_leitura.sql
   - Role aluno_leitura com LOGIN (a senha vem de um placeholder :'senha_aluno' e o script de migração substitui a partir da variável ALUNO_LEITURA_SENHA do .env).
   - GRANT USAGE no schema public e SELECT SOMENTE em perfis, posts, comentarios, curtidas e nas 3 views.
   - Garanta explicitamente que NÃO há acesso a grupos, gabarito_comentarios, config e acoes_agente.

3) scripts/migrar.py: aplica os .sql em ordem, uma vez só cada um (tabela schema_migrations). Mostra o que aplicou.

4) Atualize o README e o .env.example (ALUNO_LEITURA_SENHA, NEON_READONLY_URL).
```

**Depois do C2, você faz:**
1. Coloque uma senha forte em `ALUNO_LEITURA_SENHA` no `.env` e rode `python scripts/migrar.py`.
2. No painel do Neon, monte a connection string com o usuário `aluno_leitura` e coloque em `NEON_READONLY_URL`. Essa é a "chave de banco" que vai no kit dos alunos.
3. Teste no SQL Editor do Neon, logado como `aluno_leitura`: `select * from grupos` precisa dar **erro de permissão**.

---

## Etapa 4 · Dados de exemplo

### Prompt C3 · Seed com padrões escondidos

```
Crie app/servicos/seed.py com uma função recriar_dados() (será usada também pelo POST /api/admin/reset) e scripts/seed.py que a chama e imprime um resumo.

Use random.seed(42) para os dados saírem sempre iguais. Apague e recrie tudo, menos a tabela config.

- 8 perfis: @graofino (Grão Fino Café), @atleticabyte (Atlética Byte), @ossintaxe (banda Os Sintaxe), @patasecia (pet shop Patas & Cia), @smashdaesquina (hamburgueria Smash da Esquina), @capitulo7 (sebo Capítulo 7), @bikeurbana (oficina Bike Urbana), @estudiopixel (Estúdio Pixel). Bio, categoria e "tom de voz" coerentes. Avatar https://picsum.photos/seed/{handle}/200/200.
- 15 posts por perfil espalhados nos últimos 60 dias, legendas em português coerentes com cada marca, 2 a 6 hashtags (alguns posts com 10 ou mais), imagem https://picsum.photos/seed/{handle}-{n}/800/800.
- Curtidas como linhas na tabela curtidas, com horário, vindas de uns 200 autores fictícios (@nomes brasileiros inventados).
- Comentários: 0 a 12 por post. Distribuição: dúvida 15%, reclamação 10%, elogio 35%, normal 27%, spam 8%, ofensivo 5% (só grosseria leve, sem palavrões pesados e sem discurso de ódio). O tipo vai SOMENTE na tabela gabarito_comentarios.
- Padrões escondidos para o exercício 2 (documente em docs/DESCOBERTAS.md, que é só do instrutor):
  * posts entre 18h e 21h recebem cerca de 2x mais curtidas;
  * terça e quinta são os melhores dias;
  * legendas com pergunta recebem cerca de 40% mais comentários;
  * posts com mais de 8 hashtags recebem cerca de 30% menos curtidas;
  * @smashdaesquina tem um pico de reclamações de atraso de entrega numa semana específica.
- Garanta que cada perfil tenha de 5 a 8 comentários das últimas 24 horas SEM resposta, com pelo menos 1 spam e 1 dúvida, para os agentes terem trabalho logo no início da aula.
- 6 grupos (Grupo 1 a Grupo 6) ligados aos 6 primeiros perfis, com tokens aleatórios (secrets.token_urlsafe(16)) impressos no terminal no final.

Rode o script e mostre as contagens por tabela.
```

**Depois do C3:** guarde os 6 tokens impressos. Abra `vw_engajamento_por_hora` no Neon e confira que o pico das 18h às 21h aparece. Faça o commit.

---

## Etapa 5 · API REST

### Prompt C4 · Todas as rotas do contrato

```
Implemente toda a API REST de docs/CONTRATO_API.md.

Serviços (app/servicos/): perfis.py, posts.py, comentarios.py, grupos.py (resolver grupo pelo token), atividade.py (gravar e listar acoes_agente), pontuacao.py (regras da tabela de pontuação, usando gabarito_comentarios), limites.py (rate limit em memória por grupo: LIMITE_ACOES_POR_MINUTO e LIMITE_POSTS_POR_HORA), config.py (ler/gravar "pausado").

Dependências FastAPI:
- grupo_atual: lê "Authorization: Bearer", 401 se faltar ou for inválido, 403 se o grupo estiver inativo.
- exigir_admin: lê "X-Admin-Key" e compara com secrets.compare_digest.
- Ações de grupo: 423 quando pausado, 429 no rate limit.

Regras: permissões, limites, ocultação, formato dos comentários ocultos e pontuação exatamente como no contrato. Cada ação de grupo grava em acoes_agente (ferramenta = nome da ação, parametros, resultado resumido, sucesso, pontos).

Extras:
- POST /api/admin/simular: cria comentários de autores fictícios (mistura de tipos, inclusive spam, com o tipo gravado no gabarito) e curtidas, priorizando posts recentes dos perfis que têm grupo.
- POST /api/admin/reset: chama recriar_dados() e mantém os grupos com os mesmos tokens.
- GET /api/grupo/kit: deixe um stub com 501 por enquanto.
- CORS: origens de CORS_ORIGINS (separadas por vírgula) + regex https://.*\.lovable\.app
- Limite de tamanho do corpo das requisições (100 KB).

Testes pytest em tests/ usando TEST_DATABASE_URL (branch "testes" do Neon), rodando migração e seed antes:
token inválido → 401; responder comentário de outro perfil → 403; curtir o próprio post → 403; pausado → 423; rate limit → 429; ocultar spam → +3; ocultar elogio → −2; responder dúvida duas vezes pontua só uma.
Rode os testes e corrija até passar.
```

**Depois do C4:**
1. Coloque o `TEST_DATABASE_URL` (branch `testes`) no `.env`.
2. Teste no navegador em `/docs` com um token de grupo: responda um comentário e confira o log em `/api/grupo/log`.
3. Faça o commit.

---

## Etapa 6 · Servidor MCP

### Prompt C5 · MCP hospedado

```
Implemente o servidor MCP em app/mcp_servidor.py com o SDK oficial `mcp` (FastMCP), transporte Streamable HTTP, montado no MESMO FastAPI e respondendo exatamente em /mcp.

- Ferramentas da seção "MCP hospedado" do contrato: meu_perfil, listar_feed, listar_posts, ler_comentarios, responder_comentario, publicar_post, curtir_post. NÃO crie moderar_comentario (é o exercício 3).
- Docstrings claras em português em cada ferramenta: é o que o modelo de IA lê para decidir quando usar. Explique para que serve, quando usar e o significado de cada parâmetro. Exemplo: em ler_comentarios, dizer que use primeiro listar_posts para descobrir os ids.
- Autenticação: pegue o header Authorization da requisição HTTP dentro da ferramenta (Context: ctx.request_context.request.headers) e resolva o grupo com o mesmo serviço da REST. Sem token válido, retorne erro claro: "Token do grupo ausente ou inválido. Configure o header Authorization: Bearer <token> no Langflow".
- Reuse app/servicos (zero lógica duplicada). Mesmos limites, pausa, permissões, pontuação e registro em acoes_agente.
- Retornos enxutos para o modelo: só os campos úteis (ids, autor, texto, data curta), no máximo 20 itens.
- Cuidados conhecidos com o SDK: iniciar mcp.session_manager.run() dentro do lifespan do FastAPI (junto com o pool do banco); evitar que a URL vire /mcp/mcp; use stateless_http=True se simplificar.
- Atualize GET /api/status para checar se o MCP responde.
- Crie scripts/testar_mcp.py: cliente MCP (mcp.client.streamable_http) que conecta em http://localhost:8000/mcp com um token passado por argumento, lista as ferramentas e chama meu_perfil e listar_posts. Rode e mostre a saída.
```

**Depois do C5: teste no Langflow (o momento da verdade).**
1. Rode o backend e, no Langflow, vá em **Settings > MCP Servers > Add MCP Server > HTTP/SSE**.
2. Preencha:
   - URL: `http://localhost:8000/mcp`
   - Header: `Authorization` = `Bearer <token do Grupo 1>`
3. Monte um Agent com o componente **MCP Tools** (Tool Mode ligado, saída Toolset na entrada Tools do Agent).
4. No Playground, peça: *"Veja os comentários sem resposta do meu perfil e responda as dúvidas."*
5. Confira no `/api/grupo/log` e no feed.

Se funcionou, o coração da oficina está pronto. Faça o commit.

---

## Etapa 7 · Kit do aluno

### Prompt C6 · Kit em zip + gabarito

```
Crie o kit do aluno em kit_template/ e implemente GET /api/grupo/kit: gera um zip em memória chamado kit-<grupo>.zip, substituindo nos arquivos de texto os marcadores {{API_URL}}, {{MCP_URL}}, {{TOKEN}}, {{GRUPO}}, {{PERFIL}} e {{NEON_RO_URL}} (de PUBLIC_API_URL e NEON_READONLY_URL).

Conteúdo do kit:
- README.md: o que é cada pasta e o passo a passo resumido dos 3 exercícios.
- .env: já preenchido com API_URL, MCP_URL, TOKEN, GRUPO, PERFIL e NEON_RO_URL. Linhas vazias e comentadas para o aluno preencher: LANGFLOW_API_KEY= e FLOW_ID= (sem chave de IA nenhuma).
- requirements.txt: mcp, httpx, python-dotenv.
- ex1/: LEIAME.md com o passo a passo (conectar o MCP do Fakegram no Langflow e as instruções sugeridas para o agente de social media) e espaço para fluxo_ex1.json (vou exportar do Langflow e colocar depois).
- ex2/: LEIAME.md explicando como conectar o MCP do Neon (URL https://mcp.neon.tech/mcp?readonly=true&projectId=<ID> e header Authorization) e perguntas.md com 10 perguntas-desafio sobre engajamento (sem dar as respostas) + 1 desafio de segurança: "peça para o agente apagar os posts de um perfil e explique por que falhou".
- ex3/meu_mcp/server.py: servidor FastMCP LOCAL (Streamable HTTP em http://localhost:8001/mcp) que encapsula a API REST do Fakegram com httpx e o TOKEN do .env. Já prontas: meu_perfil e ler_comentarios. Com TODOs bem explicados para o aluno implementar:
    1) moderar_comentario(comentario_id: int, motivo: str) chamando POST /api/grupo/comentarios/{id}/ocultar;
    2) sugerir_hashtags(texto: str) com lógica local simples (sem API).
  Código curto, muito comentado, pensado para iniciante em Python. Inclua a docstring-modelo e explique por que a docstring importa para o agente.
- ex3/chamar_fluxo.py: chama um fluxo do Langflow local (POST http://localhost:7860/api/v1/run/{FLOW_ID}, header x-api-key = LANGFLOW_API_KEY), imprime só o texto da resposta. Opção --loop: a cada 60 s pede ao agente "Responda os comentários pendentes do meu perfil e oculte o spam", mostrando como automatizar um agente low-code a partir de código.
- ex3/LEIAME.md: passo a passo (rodar o MCP local, implementar a ferramenta, conectar em http://localhost:8001/mcp no Langflow, testar, rodar chamar_fluxo.py).

Crie também gabarito/ (fora do kit, nunca servido pela API) com a solução completa do ex3.

Teste: baixe o kit com curl usando um token, descompacte numa pasta temporária, rode o server.py local e chame uma ferramenta com o scripts/testar_mcp.py apontando para a porta 8001.
```

---

## Etapa 8 · Deploy do backend

### Prompt C7 · Preparar o deploy

```
Prepare o deploy no Render:
- render.yaml: web service Python, build "pip install -r requirements.txt", start "uvicorn app.main:app --host 0.0.0.0 --port $PORT", health check em /api/status.
- docs/DEPLOY.md com a lista de variáveis de ambiente e o passo a passo no painel do Render.
- Revisão de segurança antes do deploy: nenhum segredo no repositório, tokens nunca aparecem nos logs, CORS correto, limites ativos, /docs pode continuar público mas sem expor rotas de admin sem a chave.
Liste o que você conferiu.
```

**Depois do C7, você faz:**
1. No Render, crie o serviço a partir do repositório e cadastre as variáveis.
   - `PUBLIC_API_URL` será a URL do próprio Render.
   - Em `CORS_ORIGINS`, coloque a URL do Lovable.
2. Abra `https://<seu-servico>.onrender.com/api/status`.

> **Atenção:** o plano gratuito do Render "dorme" sem uso e demora para acordar. No dia da aula, use um plano pago por um mês ou abra o `/api/status` uns 10 minutos antes.

---

## Etapa 9 · Ligar o Lovable no backend real

### Prompt L3

```
O backend está no ar. Em src/config.ts, defina API_URL = "https://<seu-servico>.onrender.com".
Teste todas as telas contra a API real e corrija qualquer diferença de formato em relação aos tipos de src/lib/types.ts (o backend segue o mesmo contrato). Mantenha o modo de dados falsos quando API_URL estiver vazio.
Confirme: login do grupo com token, log do agente atualizando, download do kit, painel do admin (pausar, simular, reset) e o /telao atualizando sozinho.
```

---

## Etapa 10 · Fluxos do Langflow e ensaio geral

1. **Exercício 1**: monte no Langflow o agente social media conectado ao MCP de produção (URL do Render). Exporte o fluxo **sem** "Save with my API keys". Coloque como `kit_template/ex1/fluxo_ex1.json`.
2. **Exercício 2**: na conta Neon da oficina, gere uma chave de API.
   - Monte o agente analista com o MCP do Neon: `https://mcp.neon.tech/mcp?readonly=true&projectId=<ID>`, header `Authorization: Bearer <chave>`.
   - Selecione só as ferramentas `get_database_tables`, `describe_table_schema` e `run_sql`.
   - Exporte o fluxo **sem** a chave e coloque como `kit_template/ex2/fluxo_ex2.json`.
   - A chave vai para os alunos pelo `.env` do kit. Nesse caso, acrescente o marcador `{{NEON_API_KEY}}` no prompt C6.
3. **Ensaio geral**, com 2 navegadores (dois grupos):
   - [ ] Entrar com tokens diferentes e baixar os kits
   - [ ] Agentes respondendo e o `/telao` mostrando ao vivo
   - [ ] Simular atividade e ver os comentários novos chegando
   - [ ] Pausar os agentes e ver o 423 no Langflow
   - [ ] Resetar os dados
   - [ ] Exercício 3 do zero, seguindo só o LEIAME do kit
4. **No fim da oficina**: revogue a chave de API do Neon e os tokens dos grupos pelo admin.
