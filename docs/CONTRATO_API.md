# Contrato da API · Fakegram (Oficina Langflow)

Fonte da verdade compartilhada entre o frontend (Lovable) e o backend (Cursor).
Coloque este arquivo em `docs/CONTRATO_API.md` no repositório do backend.

- Base: `${API_URL}` (ex.: `https://oficina-api.onrender.com`)
- JSON em tudo. Datas em ISO 8601 (UTC).
- Erros: `{ "erro": "mensagem" }` com status 400, 401, 403, 404, 409, 423 ou 429.

## Autenticação

| Tipo | Como |
|---|---|
| Público | sem header |
| Grupo | `Authorization: Bearer <token_do_grupo>` |
| Admin | `X-Admin-Key: <ADMIN_KEY>` |

## Tipos

```ts
type PerfilResumo = { id: number; handle: string; nome: string; avatar_url: string };

type Perfil = PerfilResumo & {
  bio: string; categoria: string; grupo_id: number | null;
  seguidores: number; total_posts: number;
};

type Post = {
  id: number; perfil: PerfilResumo; legenda: string; imagem_url: string;
  hashtags: string[]; curtidas: number; total_comentarios: number;
  origem: "seed" | "agente" | "humano"; criado_em: string;
};

type Comentario = {
  id: number; post_id: number; autor: string; texto: string;
  origem: "seed" | "agente" | "simulador"; oculto: boolean;
  resposta_de_id: number | null; criado_em: string; respostas?: Comentario[];
};

type Atividade = {
  id: number; grupo: string; perfil_handle: string; ferramenta: string;
  resumo: string; sucesso: boolean; criado_em: string;
};

type AtividadeDetalhe = Atividade & { parametros: Record<string, unknown>; resultado: string };

type Grupo = { id: number; nome: string; perfil: Perfil; pontos: number; ativo: boolean };

type GrupoMe = Grupo & {
  mcp_url: string;
  metricas: { curtidas_recebidas: number; comentarios_sem_resposta: number; posts_hoje: number };
};

type RankingItem = {
  posicao: number; grupo: string; perfil_handle: string; pontos: number;
  respostas: number; moderacoes_corretas: number; posts: number;
};

type Status = {
  api: "ok"; banco: "ok" | "erro"; mcp: "ok" | "erro";
  agentes_pausados: boolean; versao: string;
};
```

## Endpoints públicos

| Método | Rota | Retorno |
|---|---|---|
| GET | `/api/status` | `Status` |
| GET | `/api/feed?limite=20&antes_de=<id>&perfil=<handle>` | `Post[]` (mais recentes primeiro) |
| GET | `/api/posts/{id}` | `Post & { comentarios: Comentario[] }` (comentários raiz com `respostas` aninhadas) |
| GET | `/api/perfis` | `Perfil[]` |
| GET | `/api/perfis/{handle}` | `Perfil & { posts: Post[] }` |
| GET | `/api/atividade?limite=30` | `Atividade[]` |
| GET | `/api/ranking` | `RankingItem[]` |
| GET | `/api/estudo` | `{ liberado: boolean }` |
| GET | `/api/estudo/kit` | arquivo `.zip` sem token e com os gabaritos; `403` até o instrutor liberar |

Comentários ocultos aparecem com `oculto: true` e texto `"[comentário removido pela moderação]"`.

## Endpoints do grupo (Bearer)

| Método | Rota | Corpo | Retorno |
|---|---|---|---|
| GET | `/api/grupo/me` | | `GrupoMe` |
| GET | `/api/grupo/log?limite=50` | | `AtividadeDetalhe[]` |
| GET | `/api/grupo/posts?limite=10` | | `Post[]` (só do próprio perfil) |
| GET | `/api/grupo/fila?limite=20` | | `Comentario[]` (sem resposta, das últimas 24 h, de todos os posts do perfil, mais novos primeiro) |
| GET | `/api/grupo/posts/{id}/comentarios?apenas_sem_resposta=true` | | `Comentario[]` |
| POST | `/api/grupo/posts` | `{ legenda, hashtags: string[] }` | `Post` |
| POST | `/api/grupo/posts/{id}/curtir` | | `{ curtidas: number }` |
| POST | `/api/grupo/comentarios/{id}/responder` | `{ texto }` | `Comentario` |
| POST | `/api/grupo/comentarios/{id}/ocultar` | `{ motivo }` | `{ ok: true, pontos_ganhos: number }` |
| GET | `/api/grupo/kit` | | arquivo `.zip` |

## Endpoints do admin (X-Admin-Key)

| Método | Rota | Corpo | Retorno |
|---|---|---|---|
| GET | `/api/admin/grupos` | | `(Grupo & { token: string })[]` |
| POST | `/api/admin/grupos` | `{ nome, perfil_id }` | `Grupo & { token: string }` |
| POST | `/api/admin/grupos/{id}/revogar` | | `Grupo & { token: string }` (gera token novo) |
| POST | `/api/admin/pausar` | `{ pausado: boolean }` | `{ pausado: boolean }` |
| POST | `/api/admin/reset` | | `{ ok: true }` (recria os dados de exemplo) |
| POST | `/api/admin/simular` | `{ quantidade: number }` | `{ comentarios: number, curtidas: number }` |
| POST | `/api/admin/estudo` | `{ liberado: boolean }` | `{ liberado: boolean }` (libera o kit de estudo) |

## Regras de negócio

- O grupo só age no **próprio perfil**: responder e ocultar só valem em comentários de posts do próprio perfil, e publicar só no próprio perfil.
- Curtir vale para qualquer post, **menos os do próprio perfil**.
- Limites por grupo: 30 ações por minuto e 5 posts por hora. Resposta com até 500 caracteres, legenda com até 1000.
- Com os agentes pausados, toda ação de grupo retorna `423 { "erro": "Agentes pausados pelo instrutor" }`.
- Toda ação de grupo, venha da REST ou do MCP, grava uma linha em `acoes_agente`.

## Pontuação

| Ação | Pontos |
|---|---|
| Responder comentário de dúvida ou reclamação (1x por comentário) | +2 |
| Responder elogio | +1 |
| Ocultar spam ou ofensivo | +3 |
| Ocultar comentário legítimo | −2 |
| Publicar post (até 5 por dia) | +1 |
| Receber curtida de outro grupo | +1 |

## MCP hospedado

`${API_URL}/mcp`, transporte Streamable HTTP, header `Authorization: Bearer <token_do_grupo>`.

| Ferramenta | Parâmetros |
|---|---|
| `meu_perfil` | — |
| `listar_feed` | `limite: int = 10` (posts de outros perfis) |
| `listar_posts` | `limite: int = 10` (do próprio perfil) |
| `fila_de_comentarios` | `limite: int = 20` (a fila do perfil inteiro, com `post_id` em cada item) |
| `ler_comentarios` | `post_id: int, apenas_sem_resposta: bool = True` |
| `responder_comentario` | `comentario_id: int, texto: str` |
| `publicar_post` | `legenda: str, hashtags: list[str] = []` |
| `curtir_post` | `post_id: int` |

`moderar_comentario` **não existe** no MCP hospedado de propósito: é o que os alunos constroem no exercício 3, no MCP local deles.

## Banco (Neon Postgres)

- `perfis`, `grupos` (com token), `posts`, `comentarios`, `curtidas` (uma linha por curtida, com horário), `acoes_agente`, `config` (chave/valor, ex.: `pausado`).
- `gabarito_comentarios(comentario_id, tipo)` com tipo em `normal`, `elogio`, `duvida`, `reclamacao`, `spam` ou `ofensivo`. Serve para a pontuação e fica escondido dos alunos.
- Views: `vw_engajamento_posts`, `vw_engajamento_por_hora`, `vw_engajamento_por_dia_semana`.
- Role `aluno_leitura`: só `SELECT` em `perfis`, `posts`, `comentarios`, `curtidas` e nas views. **Nunca** em `grupos`, `gabarito_comentarios`, `config` ou `acoes_agente`.
