export type PerfilResumo = { id: number; handle: string; nome: string; avatar_url: string };
export type Perfil = PerfilResumo & {
  bio: string;
  categoria: string;
  grupo_id: number | null;
  seguidores: number;
  total_posts: number;
};
export type Post = {
  id: number;
  perfil: PerfilResumo;
  legenda: string;
  imagem_url: string;
  hashtags: string[];
  curtidas: number;
  total_comentarios: number;
  origem: "seed" | "agente" | "humano";
  criado_em: string;
};
export type Comentario = {
  id: number;
  post_id: number;
  autor: string;
  texto: string;
  origem: "seed" | "agente" | "simulador";
  oculto: boolean;
  resposta_de_id: number | null;
  criado_em: string;
  respostas?: Comentario[];
};
export type Atividade = {
  id: number;
  grupo: string;
  perfil_handle: string;
  ferramenta: string;
  resumo: string;
  sucesso: boolean;
  criado_em: string;
};
export type AtividadeDetalhe = Atividade & {
  parametros: Record<string, unknown>;
  resultado: string;
};
export type Grupo = { id: number; nome: string; perfil: Perfil; pontos: number; ativo: boolean };
export type GrupoMe = Grupo & {
  mcp_url: string;
  metricas: { curtidas_recebidas: number; comentarios_sem_resposta: number; posts_hoje: number };
};
export type RankingItem = {
  posicao: number;
  grupo: string;
  perfil_handle: string;
  pontos: number;
  respostas: number;
  moderacoes_corretas: number;
  posts: number;
};
export type Status = {
  api: "ok";
  banco: "ok" | "erro";
  mcp: "ok" | "erro";
  agentes_pausados: boolean;
  versao: string;
};
export type PostDetalhe = Post & { comentarios: Comentario[] };
export type PerfilDetalhe = Perfil & { posts: Post[] };
export type GrupoAdmin = Grupo & { token: string };
