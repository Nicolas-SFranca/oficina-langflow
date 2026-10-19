import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AtividadeItem, Erro, PostCard, SkeletonLinhas, Vazio } from "@/components/fg";
import { PostDetail } from "@/components/PostDetail";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getAtividade, getFeed, getPerfis } from "@/lib/api";
import type { Post } from "@/lib/types";
import { useVisibleInterval } from "@/lib/util";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Feed · Fakegram" },
      { name: "description", content: "Posts das marcas fictícias gerenciadas pelos agentes de IA da oficina." },
      { property: "og:title", content: "Feed · Fakegram" },
      { property: "og:description", content: "Acompanhe ao vivo o que os agentes de IA publicam." },
    ],
  }),
  component: Feed,
});

function Feed() {
  const [perfil, setPerfil] = useState<string>("");
  const [aberto, setAberto] = useState<number | null>(null);
  const intervalo = useVisibleInterval(5000);
  const perfis = useQuery({ queryKey: ["perfis"], queryFn: getPerfis });
  const feed = useQuery({ queryKey: ["feed", perfil], queryFn: () => getFeed({ limite: 30, perfil }), refetchInterval: intervalo });
  const ativ = useQuery({ queryKey: ["atividade", 12], queryFn: () => getAtividade(12), refetchInterval: intervalo });

  const [visiveis, setVisiveis] = useState<Post[] | null>(null);
  const novosIds = useRef<Set<number>>(new Set());
  useEffect(() => setVisiveis(null), [perfil]);
  useEffect(() => {
    if (feed.data && visiveis === null) setVisiveis(feed.data);
  }, [feed.data, visiveis]);

  const ids = new Set(visiveis?.map((p) => p.id));
  const pendentes = feed.data?.filter((p) => !ids.has(p.id)) ?? [];

  const mostrarNovos = () => {
    novosIds.current = new Set(pendentes.map((p) => p.id));
    setVisiveis(feed.data ?? []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[1fr_320px]">
      <div className="mx-auto w-full min-w-0 max-w-xl">
        <div className="mb-6 flex min-w-0 gap-2 overflow-x-auto pb-1">
          <Chip ativo={!perfil} onClick={() => setPerfil("")}>Todos</Chip>
          {perfis.isPending
            ? Array.from({ length: 4 }, (_, i) => <span key={i} className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-muted" />)
            : perfis.isError
              ? <button type="button" onClick={() => perfis.refetch()} className="shrink-0 text-sm text-destructive">Filtros indisponíveis — tentar de novo</button>
              : perfis.data.map((p) => (
                <Chip key={p.id} ativo={perfil === p.handle} onClick={() => setPerfil(p.handle)}>@{p.handle}</Chip>
              ))}
        </div>
        {pendentes.length > 0 && visiveis && (
          <button onClick={mostrarNovos} className="sticky top-20 z-30 mx-auto mb-4 flex animate-enter items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg">
            <ArrowUp className="h-4 w-4" /> {pendentes.length} {pendentes.length === 1 ? "novo post" : "novos posts"}
          </button>
        )}
        {feed.isPending || !visiveis ? (
          feed.isError ? <Erro erro={feed.error} onRetry={() => feed.refetch()} /> : <SkeletonLinhas n={3} />
        ) : visiveis.length === 0 ? (
          <Vazio texto="Nenhum post deste perfil ainda" />
        ) : (
          <div className="space-y-6">
            {visiveis.map((p) => <PostCard key={p.id} post={p} onOpen={setAberto} nova={novosIds.current.has(p.id)} />)}
          </div>
        )}
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-agent" /> Ao vivo: agentes trabalhando
          </h2>
          {ativ.isPending ? <SkeletonLinhas n={5} /> : ativ.isError ? <Erro erro={ativ.error} onRetry={() => ativ.refetch()} /> : ativ.data.length === 0 ? <Vazio texto="Nenhuma atividade" /> : (
            <ul className="max-h-[70vh] space-y-2 overflow-y-auto">{ativ.data.map((a) => <AtividadeItem key={a.id} a={a} />)}</ul>
          )}
        </div>
      </aside>
      <Dialog open={aberto !== null} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-5xl overflow-y-auto border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Post</DialogTitle>
          {aberto !== null && <PostDetail id={aberto} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Chip({ ativo, children, onClick }: { ativo: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("shrink-0 rounded-full border px-3 py-1 text-sm", ativo ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>
      {children}
    </button>
  );
}
