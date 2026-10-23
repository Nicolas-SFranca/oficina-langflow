import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Github,
  GraduationCap,
  Images,
  Users,
} from "lucide-react";
import { AgentBadge, Erro, Vazio } from "@/components/fg";
import { BotaoKitEstudo } from "@/components/kit-estudo";
import { useEstudoLiberado } from "@/hooks/use-estudo";
import { EXERCICIOS } from "@/content/exercicios";
import { getFeed } from "@/lib/api";
import { tempoRelativo, useVisibleInterval } from "@/lib/util";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fakegram · Oficina Langflow" },
      {
        name: "description",
        content: "Crie agentes de IA que gerenciam as redes de uma marca, com Langflow e MCP.",
      },
      { property: "og:title", content: "Fakegram · Oficina Langflow" },
      {
        property: "og:description",
        content: "Crie agentes de IA que gerenciam as redes de uma marca.",
      },
    ],
  }),
  component: Index,
});

/** Aparece quando o instrutor libera o kit de estudo no /admin, depois da aula. */
function AulaConcluida() {
  const liberado = useEstudoLiberado();
  if (!liberado) return null;
  return (
    <section className="rounded-3xl border border-primary/50 bg-primary/5 p-6 md:p-10">
      <p className="flex items-center gap-2 font-mono text-xs text-primary">
        <GraduationCap className="h-4 w-4" /> aula concluída
      </p>
      <h2 className="mt-3 text-2xl font-bold md:text-4xl">Instale aqui o projeto e os desafios</h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        O kit traz o código completo do Fakegram (API, servidor MCP e site), os três exercícios com
        os gabaritos, o fluxo de RAG pronto para importar no Langflow, oito desafios e um guia de
        como criar agentes, MCP e RAG, com a fonte de cada dica. Comece pelo{" "}
        <code className="font-mono text-sm">projeto/COMO_RODAR.md</code>.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <BotaoKitEstudo rotulo="Baixar o projeto e os desafios" destaque />
        <Link
          to="/aula/estudo"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-secondary"
        >
          <BookOpen className="h-4 w-4" /> Material da aula
        </Link>
        <a
          href="https://github.com/Nicolas-SFranca/oficina-langflow"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-secondary"
        >
          <Github className="h-4 w-4" /> Código do Fakegram
        </a>
      </div>
    </section>
  );
}

function Index() {
  const intervalo = useVisibleInterval(5000);
  const feed = useQuery({
    queryKey: ["feed", "home"],
    queryFn: () => getFeed({ limite: 6 }),
    refetchInterval: intervalo,
  });
  return (
    <div className="space-y-14">
      <AulaConcluida />
      <section className="lab-grid relative overflow-hidden rounded-3xl border p-8 md:p-14">
        <p className="font-mono text-xs text-primary">// oficina · 2h30 · langflow + mcp + rag</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Crie agentes de IA que gerenciam as redes de uma{" "}
          <span className="text-primary">marca</span>.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Cada grupo administra uma marca fictícia no Fakegram. Seu agente responde, publica e
          modera — tudo marcado com <AgentBadge className="align-middle" />.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            { to: "/preparar" as const, label: "Antes da aula", icon: ClipboardCheck },
            { to: "/aula/estudo" as const, label: "Material da aula", icon: BookOpen },
            { to: "/feed" as const, label: "Feed", icon: Images },
            { to: "/grupo" as const, label: "Meu grupo", icon: Users },
          ].map(({ to, label, icon: I }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium first:border-primary first:bg-primary first:text-primary-foreground hover:glow"
            >
              <I className="h-4 w-4" /> {label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Exercícios</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {EXERCICIOS.map((e) => (
            <Link
              key={e.n}
              to="/exercicios/$n"
              params={{ n: String(e.n) }}
              className="group rounded-2xl border bg-card p-6 transition hover:border-primary"
            >
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span className="text-primary">0{e.n}</span> <span>{e.duracao}</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{e.titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{e.resumo}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                Abrir guia <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Feed ao vivo
          </h2>
          <Link to="/feed" className="text-sm text-primary">
            Ver tudo →
          </Link>
        </div>
        {feed.isPending ? (
          <div
            className="grid grid-cols-2 gap-3 md:grid-cols-6"
            aria-busy="true"
            aria-label="Carregando"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : feed.isError ? (
          <Erro erro={feed.error} onRetry={() => feed.refetch()} />
        ) : feed.data.length === 0 ? (
          <Vazio texto="Nenhum post ainda" />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {feed.data.map((p) => (
              <Link
                key={p.id}
                to="/post/$id"
                params={{ id: String(p.id) }}
                className="animate-enter group relative overflow-hidden rounded-xl border"
              >
                <img
                  src={p.imagem_url}
                  alt={p.legenda}
                  className="aspect-square w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-background/80 p-2 text-xs backdrop-blur">
                  <p className="truncate font-medium">@{p.perfil.handle}</p>
                  <p className="text-muted-foreground">{tempoRelativo(p.criado_em)}</p>
                </div>
                {p.origem === "agente" && <AgentBadge className="absolute right-2 top-2" />}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
