import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getPost } from "@/lib/api";
import { tempoRelativo } from "@/lib/util";
import { AgentBadge, Avatar, ComentarioItem, Erro, SkeletonLinhas, Vazio } from "./fg";

export function PostDetail({ id }: { id: number }) {
  const q = useQuery({ queryKey: ["post", id], queryFn: () => getPost(id) });
  if (q.isPending) {
    return (
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]" aria-busy="true" aria-label="Carregando">
        <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
        <SkeletonLinhas n={5} />
      </div>
    );
  }
  if (q.isError) return <Erro erro={q.error} onRetry={() => q.refetch()} />;
  const p = q.data;
  return (
    <div className="grid overflow-hidden rounded-2xl border bg-card md:max-h-[85dvh] md:grid-cols-[1.2fr_1fr]">
      <img src={p.imagem_url} alt={p.legenda} className="aspect-square max-h-[46dvh] w-full bg-muted object-cover md:max-h-none" />
      <div className="flex max-h-[50dvh] flex-col md:max-h-[85dvh]">
        <header className="flex items-center gap-3 border-b p-4">
          <Avatar src={p.perfil.avatar_url} alt={p.perfil.nome} />
          <Link to="/perfil/$handle" params={{ handle: p.perfil.handle }} className="font-semibold hover:text-primary">@{p.perfil.handle}</Link>
          {p.origem === "agente" && <AgentBadge />}
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm">{p.legenda}</p>
          <p className="mt-1 text-sm text-primary">{p.hashtags.map((h) => `#${h}`).join(" ")}</p>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">{p.curtidas} curtidas · {tempoRelativo(p.criado_em)}</p>
          {p.comentarios.length === 0 ? <Vazio texto="Nenhum comentário ainda" /> : p.comentarios.map((c) => <ComentarioItem key={c.id} c={c} />)}
        </div>
      </div>
    </div>
  );
}
