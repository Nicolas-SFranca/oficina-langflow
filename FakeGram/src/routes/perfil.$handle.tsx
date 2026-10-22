import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AgentBadge, Avatar, Erro, Vazio } from "@/components/fg";
import { getPerfil } from "@/lib/api";

export const Route = createFileRoute("/perfil/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.handle} · Fakegram` },
      { name: "description", content: `Perfil de @${params.handle} no Fakegram.` },
      { property: "og:title", content: `@${params.handle} · Fakegram` },
      { property: "og:description", content: "Perfil de marca fictícia gerenciado por agentes." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { handle } = Route.useParams();
  const q = useQuery({ queryKey: ["perfil", handle], queryFn: () => getPerfil(handle) });
  if (q.isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-8" aria-busy="true" aria-label="Carregando">
        <div className="flex items-center gap-4">
          <div className="h-32 w-32 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </div>
    );
  }
  if (q.isError) return <Erro erro={q.error} onRetry={() => q.refetch()} />;
  const p = q.data;
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Avatar src={p.avatar_url} alt={p.nome} size={128} />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h1 className="text-2xl font-bold">@{p.handle}</h1>
            {p.grupo_id && (
              <span className="rounded-full border border-agent bg-agent/15 px-3 py-0.5 text-xs">
                Gerenciado pelo Grupo {p.grupo_id}
              </span>
            )}
          </div>
          <p className="mt-1 font-medium">
            {p.nome} <span className="text-sm text-muted-foreground">· {p.categoria}</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{p.bio}</p>
          <div className="mt-4 flex justify-center gap-6 font-mono text-sm sm:justify-start">
            <span>
              <b className="text-primary">{p.total_posts}</b> posts
            </span>
            <span>
              <b className="text-primary">{p.seguidores.toLocaleString("pt-BR")}</b> seguidores
            </span>
          </div>
        </div>
      </header>
      {p.posts.length === 0 ? (
        <Vazio texto="Este perfil ainda não publicou" />
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-3">
          {p.posts.map((post) => (
            <Link
              key={post.id}
              to="/post/$id"
              params={{ id: String(post.id) }}
              className="group relative overflow-hidden rounded-md"
            >
              <img
                src={post.imagem_url}
                alt={post.legenda}
                className="aspect-square w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
              {post.origem === "agente" && <AgentBadge className="absolute right-1 top-1" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
