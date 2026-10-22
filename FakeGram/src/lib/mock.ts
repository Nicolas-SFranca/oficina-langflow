// @ts-nocheck -- dados falsos de demonstração
import type { Atividade, AtividadeDetalhe, Comentario, GrupoAdmin, GrupoMe, Perfil, PerfilDetalhe, Post, PostDetalhe, RankingItem, Status } from "./types";

// Dados falsos usados quando API_URL está vazio. Estado em memória (some ao recarregar).
export const MOCK_ADMIN_KEY = "oficina";

const MARCAS: Array<[string, string, string, string, string[]]> = [
  ["graofino", "Grão Fino Café", "Cafeteria", "Café especial torrado na semana. ☕ Aberto de seg a sáb.", ["cafe", "baristas", "graofino"]],
  ["atleticabyte", "Atlética Byte", "Atlética universitária", "A atlética mais rápida do campus. Bora, Byte!", ["atletica", "interbyte", "sistemas"]],
  ["ossintaxe", "Os Sintaxe", "Banda", "Rock de garagem com letras sobre bugs e amores compilados.", ["rock", "showaovivo", "ossintaxe"]],
  ["patasecia", "Patas & Cia", "Pet shop", "Banho, tosa e muito carinho para o seu pet. 🐾", ["pet", "banhoetosa", "adote"]],
  ["smashdaesquina", "Smash da Esquina", "Hamburgueria", "Smash burger prensado na chapa. Delivery até 23h.", ["burger", "smash", "delivery"]],
  ["capitulo7", "Capítulo 7", "Sebo", "Livros usados com histórias novas. Compramos e vendemos.", ["livros", "sebo", "leitura"]],
  ["bikeurbana", "Bike Urbana", "Oficina de bicicletas", "Revisão, peças e rolês pela cidade. 🚲", ["bike", "pedal", "mobilidade"]],
  ["estudiopixel", "Estúdio Pixel", "Estúdio de design", "Identidade visual, UI e muito pixel bem colocado.", ["design", "branding", "ui"]],
];

const LEGENDAS = [
  "Novidade fresquinha chegando hoje! Quem já experimentou?",
  "Bastidores de mais um dia de trabalho por aqui.",
  "Promoção relâmpago só até domingo. Corre!",
  "Obrigado pelo carinho de vocês nessa semana incrível.",
  "Qual vocês preferem? Conta aqui nos comentários 👇",
  "Sextou com a nossa equipe completa.",
  "Detalhe que faz toda a diferença.",
  "Agenda aberta para a próxima semana.",
  "Vem conhecer o nosso espaço renovado!",
  "Mais um cliente feliz. Isso não tem preço.",
];

const COMENTARIOS: Array<[string, string]> = [
  ["ana.lima", "Que lindo! Amei demais 😍"],
  ["joaopedro", "vocês abrem domingo?"],
  ["carla_s", "meu pedido atrasou 1h, ninguém responde o whats"],
  ["promo_bot99", "ganhe 10 mil seguidores grátis: bit.ly/xxx"],
  ["rafa.dev", "Qual o preço?"],
  ["bia.m", "Melhor da cidade, sem dúvidas"],
  ["lucas_rocha", "Tem opção vegana?"],
  ["seguidores_br", "COMPRE SEGUIDORES REAIS 👉 bit.ly/yyy"],
  ["marina.t", "Fui ontem e fui super bem atendida!"],
  ["pedrohf", "aceitam pix?"],
];

const RESPOSTAS_AGENTE = [
  "Oi! Ficamos muito felizes com seu comentário 💚",
  "Olá! Abrimos aos domingos das 9h às 14h. Te esperamos!",
  "Sentimos muito pelo atraso 😔 Mandamos uma DM para resolver agora.",
  "Aceitamos sim! Pix, cartão e dinheiro.",
];

const FERRAMENTAS = ["responder_comentario", "publicar_post", "moderar_comentario", "listar_comentarios", "curtir_post", "consultar_metricas"];

type Store = {
  perfis: Perfil[];
  posts: Post[];
  comentarios: Comentario[];
  atividades: AtividadeDetalhe[];
  grupos: GrupoAdmin[];
  pausado: boolean;
  estudoLiberado: boolean;
  nextPost: number;
  nextComent: number;
  nextAtiv: number;
};

let store: Store | null = null;
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

function build(): Store {
  const perfis: Perfil[] = MARCAS.map(([handle, nome, categoria, bio], i) => ({
    id: i + 1, handle, nome, categoria, bio,
    avatar_url: `https://picsum.photos/seed/${handle}/200/200`,
    grupo_id: i < 6 ? i + 1 : null,
    seguidores: 800 + ((i * 1373) % 4200),
    total_posts: 10,
  }));
  const posts: Post[] = [];
  const comentarios: Comentario[] = [];
  let pid = 1, cid = 1;
  for (let n = 10; n >= 1; n--) {
    perfis.forEach((p, i) => {
      const k = (n + i) % LEGENDAS.length;
      const minutos = (n - 1) * 47 + i * 5 + 3;
      const post: Post = {
        id: pid++, perfil: resumo(p), legenda: LEGENDAS[k],
        imagem_url: `https://picsum.photos/seed/${p.handle}-${n}/800/800`,
        hashtags: MARCAS[i][4].slice(0, 1 + (n % 3)),
        curtidas: 12 + ((n * 37 + i * 11) % 240), total_comentarios: 0,
        origem: n % 4 === 0 ? "agente" : "seed", criado_em: ago(minutos),
      };
      const qtd = (n + i) % 5;
      for (let c = 0; c < qtd; c++) {
        const [autor, texto] = COMENTARIOS[(n * 3 + i + c * 7) % COMENTARIOS.length];
        const spam = texto.includes("bit.ly");
        const com: Comentario = { id: cid++, post_id: post.id, autor, texto, origem: "seed", oculto: spam && (n + c) % 2 === 0, resposta_de_id: null, criado_em: ago(minutos - c - 1) };
        comentarios.push(com);
        if (!spam && (n + c + i) % 3 === 0) {
          comentarios.push({ id: cid++, post_id: post.id, autor: p.handle, texto: RESPOSTAS_AGENTE[(n + c) % RESPOSTAS_AGENTE.length], origem: "agente", oculto: false, resposta_de_id: com.id, criado_em: ago(Math.max(minutos - c - 2, 0)) });
        }
      }
      post.total_comentarios = comentarios.filter((x) => x.post_id === post.id).length;
      posts.push(post);
    });
  }
  posts.sort((a, b) => b.criado_em.localeCompare(a.criado_em));

  const grupos: GrupoAdmin[] = perfis.slice(0, 6).map((p, i) => ({
    id: i + 1, nome: `Grupo ${i + 1}`, perfil: p, pontos: [42, 37, 51, 28, 33, 19][i], ativo: true,
    token: `fg_demo_grupo${i + 1}_${(7919 * (i + 3)).toString(16)}`,
  }));

  const atividades: AtividadeDetalhe[] = [];
  for (let a = 0; a < 20; a++) atividades.push(makeAtividade(a + 1, grupos[a % 6], a * 2 + 1, a % 7 !== 6));
  return { perfis, posts, comentarios, atividades, grupos, pausado: false, estudoLiberado: false, nextPost: pid, nextComent: cid, nextAtiv: 21 };
}

function resumo(p: Perfil) {
  return { id: p.id, handle: p.handle, nome: p.nome, avatar_url: p.avatar_url };
}

function makeAtividade(id: number, g: GrupoAdmin, minutos: number, sucesso: boolean): AtividadeDetalhe {
  const ferramenta = FERRAMENTAS[id % FERRAMENTAS.length];
  const h = g.perfil.handle;
  const verbo: Record<string, string> = {
    responder_comentario: `respondeu um comentário em @${h}`,
    publicar_post: `publicou um post em @${h}`,
    moderar_comentario: `ocultou um spam em @${h}`,
    listar_comentarios: `listou comentários pendentes de @${h}`,
    curtir_post: `curtiu um post de @${h}`,
    consultar_metricas: `consultou métricas de @${h}`,
  };
  return {
    id, grupo: g.nome, perfil_handle: h, ferramenta, sucesso, criado_em: ago(minutos),
    resumo: sucesso ? `${g.nome} ${verbo[ferramenta]}` : `${g.nome} tentou ${ferramenta} em @${h} (erro)`,
    parametros: { perfil: h, post_id: 10 + id, ...(ferramenta === "responder_comentario" ? { texto: RESPOSTAS_AGENTE[id % 4] } : {}) },
    resultado: JSON.stringify(sucesso ? { ok: true, id: 1000 + id } : { erro: "comentário não encontrado" }),
  };
}

function db() {
  if (!store) store = build();
  return store;
}

/** Simula vida na rede: de vez em quando um agente publica algo novo. */
function tick() {
  const s = db();
  if (s.pausado) return;
  if (Math.random() < 0.35) {
    const g = s.grupos[Math.floor(Math.random() * s.grupos.length)];
    const p = g.perfil;
    const n = s.nextPost++;
    const idx = s.perfis.findIndex((x) => x.id === p.id);
    s.posts.unshift({
      id: n, perfil: resumo(p), legenda: LEGENDAS[n % LEGENDAS.length] + " (post do agente)",
      imagem_url: `https://picsum.photos/seed/${p.handle}-novo${n}/800/800`, hashtags: MARCAS[idx][4].slice(0, 2),
      curtidas: 0, total_comentarios: 0, origem: "agente", criado_em: new Date().toISOString(),
    });
    p.total_posts++;
  }
  if (Math.random() < 0.6) {
    const g = s.grupos[Math.floor(Math.random() * s.grupos.length)];
    s.atividades.unshift(makeAtividade(s.nextAtiv++, g, 0, Math.random() > 0.15));
    g.pontos += 1;
  }
}

const tree = (list: Comentario[]): Comentario[] => {
  const by = new Map<number, Comentario>();
  list.forEach((c) => by.set(c.id, { ...c, respostas: [] }));
  const roots: Comentario[] = [];
  by.forEach((c) => (c.resposta_de_id && by.get(c.resposta_de_id) ? by.get(c.resposta_de_id)!.respostas!.push(c) : roots.push(c)));
  return roots;
};

export class MockError extends Error {}

function exigirGrupo(token: string | null) {
  const g = db().grupos.find((x) => x.token === token && x.ativo);
  if (!g) throw new MockError("Token inválido ou revogado");
  return g;
}
function exigirAdmin(key: string | null) {
  if (key !== MOCK_ADMIN_KEY) throw new MockError("Chave de admin inválida");
}

export const mock = {
  status: (): Status => ({ api: "ok", banco: "ok", mcp: "ok", agentes_pausados: db().pausado, versao: "demo-1.0" }),
  feed: (q: { limite?: number; antes_de?: number; perfil?: string }): Post[] => {
    tick();
    let list = db().posts;
    if (q.perfil) list = list.filter((p) => p.perfil.handle === q.perfil);
    if (q.antes_de) list = list.filter((p) => p.id < q.antes_de!);
    return list.slice(0, q.limite ?? 20);
  },
  post: (id: number): PostDetalhe => {
    const p = db().posts.find((x) => x.id === id);
    if (!p) throw new MockError("Post não encontrado");
    return { ...p, comentarios: tree(db().comentarios.filter((c) => c.post_id === id)) };
  },
  perfis: () => db().perfis,
  perfil: (handle: string): PerfilDetalhe => {
    const p = db().perfis.find((x) => x.handle === handle);
    if (!p) throw new MockError("Perfil não encontrado");
    return { ...p, posts: db().posts.filter((x) => x.perfil.handle === handle) };
  },
  atividade: (limite: number): Atividade[] => {
    tick();
    return db().atividades.slice(0, limite).map(({ parametros: _p, resultado: _r, ...a }) => a);
  },
  ranking: (): RankingItem[] =>
    [...db().grupos].filter((g) => g.ativo).sort((a, b) => b.pontos - a.pontos).map((g, i) => ({
      posicao: i + 1, grupo: g.nome, perfil_handle: g.perfil.handle, pontos: g.pontos,
      respostas: Math.floor(g.pontos / 3), moderacoes_corretas: Math.floor(g.pontos / 7), posts: 2 + (g.pontos % 5),
    })),
  grupoMe: (token: string | null): GrupoMe => {
    const g = exigirGrupo(token);
    const { token: _t, ...rest } = g;
    return { ...rest, mcp_url: "https://fakegram-demo.exemplo.com/mcp", metricas: { curtidas_recebidas: 312 + g.pontos, comentarios_sem_resposta: 3 + (g.id % 4), posts_hoje: 1 + (g.id % 3) } };
  },
  grupoLog: (token: string | null, limite: number) => {
    const g = exigirGrupo(token);
    tick();
    return db().atividades.filter((a) => a.grupo === g.nome).slice(0, limite);
  },
  kit: (token: string | null) => {
    const g = exigirGrupo(token);
    return new Blob([`Kit de demonstração do ${g.nome}.\nConfigure API_URL para baixar o kit real.`], { type: "text/plain" });
  },
  estudo: () => ({ liberado: db().estudoLiberado }),
  kitEstudo: () => {
    if (!db().estudoLiberado) throw new MockError("O kit de estudo é liberado pelo instrutor depois da aula");
    return new Blob(["Kit de estudo de demonstração.\nConfigure API_URL para baixar o kit real."], { type: "text/plain" });
  },
  adminEstudo: (key: string | null, liberado: boolean) => {
    exigirAdmin(key);
    db().estudoLiberado = liberado;
    return { liberado };
  },
  adminGrupos: (key: string | null) => { exigirAdmin(key); return db().grupos; },
  adminCriarGrupo: (key: string | null, nome: string, perfil_id: number) => {
    exigirAdmin(key);
    const s = db();
    const p = s.perfis.find((x) => x.id === perfil_id);
    if (!p || p.grupo_id) throw new MockError("Perfil indisponível");
    const id = s.grupos.length + 1;
    p.grupo_id = id;
    const g = { id, nome, perfil: p, pontos: 0, ativo: true, token: `fg_demo_grupo${id}_${(7919 * (id + 3)).toString(16)}` };
    s.grupos.push(g);
    return g;
  },
  adminRevogar: (key: string | null, id: number) => {
    exigirAdmin(key);
    const g = db().grupos.find((x) => x.id === id);
    if (g) g.ativo = false;
    return { ok: true };
  },
  adminPausar: (key: string | null, pausado: boolean) => { exigirAdmin(key); db().pausado = pausado; return { ok: true }; },
  adminReset: (key: string | null) => { exigirAdmin(key); store = build(); return { ok: true }; },
  adminSimular: (key: string | null, quantidade: number) => {
    exigirAdmin(key);
    const s = db();
    for (let i = 0; i < quantidade; i++) {
      const g = s.grupos[i % s.grupos.length];
      s.atividades.unshift(makeAtividade(s.nextAtiv++, g, 0, true));
      g.pontos++;
    }
    return { ok: true };
  },
};
