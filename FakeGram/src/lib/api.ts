import { API_URL } from "@/config";
import { mock } from "./mock";
import type { Atividade, AtividadeDetalhe, GrupoAdmin, GrupoMe, Perfil, PerfilDetalhe, Post, PostDetalhe, RankingItem, Status } from "./types";

export const TOKEN_KEY = "fakegram_token";
export const ADMIN_KEY = "fakegram_admin";
export const MODO_DEMO = !API_URL;

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY));
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));
export const getAdminKey = () => (typeof window === "undefined" ? null : sessionStorage.getItem(ADMIN_KEY));
export const setAdminKey = (k: string | null) => (k ? sessionStorage.setItem(ADMIN_KEY, k) : sessionStorage.removeItem(ADMIN_KEY));

type Auth = "grupo" | "admin" | undefined;

const espera = () => new Promise((r) => setTimeout(r, 250 + Math.random() * 350));

async function viaMock<T>(fn: () => T): Promise<T> {
  await espera();
  return fn();
}

async function req<T>(rota: string, opts: { method?: string; body?: unknown; auth?: Auth; blob?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth === "grupo") headers["Authorization"] = `Bearer ${getToken() ?? ""}`;
  if (opts.auth === "admin") headers["X-Admin-Key"] = getAdminKey() ?? "";
  let res: Response;
  try {
    res = await fetch(`${API_URL}${rota}`, { method: opts.method ?? "GET", headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : null });
  } catch {
    throw new Error("Não foi possível conectar à API");
  }
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      if (j?.erro) msg = j.erro;
    } catch { /* corpo não-JSON */ }
    throw new Error(msg);
  }
  if (opts.blob) return (await res.blob()) as T;
  return res.json() as Promise<T>;
}

const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
};

// Públicas
export const getStatus = () => (MODO_DEMO ? viaMock(mock.status) : req<Status>("/api/status"));
export const getFeed = (q: { limite?: number; antes_de?: number; perfil?: string } = {}) =>
  MODO_DEMO ? viaMock(() => mock.feed(q)) : req<Post[]>(`/api/feed${qs(q)}`);
export const getPost = (id: number) => (MODO_DEMO ? viaMock(() => mock.post(id)) : req<PostDetalhe>(`/api/posts/${id}`));
export const getPerfis = () => (MODO_DEMO ? viaMock(mock.perfis) : req<Perfil[]>("/api/perfis"));
export const getPerfil = (handle: string) => (MODO_DEMO ? viaMock(() => mock.perfil(handle)) : req<PerfilDetalhe>(`/api/perfis/${handle}`));
export const getAtividade = (limite = 20) => (MODO_DEMO ? viaMock(() => mock.atividade(limite)) : req<Atividade[]>(`/api/atividade${qs({ limite })}`));
export const getRanking = () => (MODO_DEMO ? viaMock(mock.ranking) : req<RankingItem[]>("/api/ranking"));

// Grupo
export const grupoMe = () => (MODO_DEMO ? viaMock(() => mock.grupoMe(getToken())) : req<GrupoMe>("/api/grupo/me", { auth: "grupo" }));
export const grupoLog = (limite = 50) =>
  MODO_DEMO ? viaMock(() => mock.grupoLog(getToken(), limite)) : req<AtividadeDetalhe[]>(`/api/grupo/log${qs({ limite })}`, { auth: "grupo" });
function salvarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
export async function baixarKit() {
  const blob = MODO_DEMO ? await viaMock(() => mock.kit(getToken())) : await req<Blob>("/api/grupo/kit", { auth: "grupo", blob: true });
  salvarArquivo(blob, MODO_DEMO ? "kit-demo.txt" : "kit-fakegram.zip");
}

// Kit de estudo: sem token, com os gabaritos, liberado pelo instrutor depois da aula
export const getEstudo = () => (MODO_DEMO ? viaMock(mock.estudo) : req<{ liberado: boolean }>("/api/estudo"));
export async function baixarKitEstudo() {
  const blob = MODO_DEMO ? await viaMock(mock.kitEstudo) : await req<Blob>("/api/estudo/kit", { blob: true });
  salvarArquivo(blob, MODO_DEMO ? "kit-de-estudo-demo.txt" : "kit-de-estudo-fakegram.zip");
}

// Admin
const k = getAdminKey;
export const adminGrupos = () => (MODO_DEMO ? viaMock(() => mock.adminGrupos(k())) : req<GrupoAdmin[]>("/api/admin/grupos", { auth: "admin" }));
export const adminCriarGrupo = (nome: string, perfil_id: number) =>
  MODO_DEMO ? viaMock(() => mock.adminCriarGrupo(k(), nome, perfil_id)) : req("/api/admin/grupos", { method: "POST", auth: "admin", body: { nome, perfil_id } });
export const adminRevogar = (id: number) =>
  MODO_DEMO ? viaMock(() => mock.adminRevogar(k(), id)) : req(`/api/admin/grupos/${id}/revogar`, { method: "POST", auth: "admin" });
export const adminPausar = (pausado: boolean) =>
  MODO_DEMO ? viaMock(() => mock.adminPausar(k(), pausado)) : req("/api/admin/pausar", { method: "POST", auth: "admin", body: { pausado } });
export const adminEstudo = (liberado: boolean) =>
  MODO_DEMO ? viaMock(() => mock.adminEstudo(k(), liberado)) : req("/api/admin/estudo", { method: "POST", auth: "admin", body: { liberado } });
export const adminReset = () => (MODO_DEMO ? viaMock(() => mock.adminReset(k())) : req("/api/admin/reset", { method: "POST", auth: "admin" }));
export const adminSimular = (quantidade: number) =>
  MODO_DEMO ? viaMock(() => mock.adminSimular(k(), quantidade)) : req("/api/admin/simular", { method: "POST", auth: "admin", body: { quantidade } });
