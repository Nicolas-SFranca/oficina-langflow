import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { AgentBadge, AtividadeItem, Avatar, Erro, Vazio } from "@/components/fg";
import { getAtividade, getFeed, getRanking } from "@/lib/api";
import { tempoRelativo, useVisibleInterval } from "@/lib/util";

export const Route = createFileRoute("/telao")({
  head: () => ({
    meta: [
      { title: "Telão · Fakegram" },
      { name: "description", content: "Telão ao vivo da oficina: posts, atividades dos agentes e ranking." },
      { property: "og:title", content: "Telão · Fakegram" },
      { property: "og:description", content: "Painel ao vivo para o projetor." },
    ],
  }),
  component: Telao,
});

function Telao() {
  const intervalo = useVisibleInterval(3000);
  const feed = useQuery({ queryKey: ["telao-feed"], queryFn: () => getFeed({ limite: 6 }), refetchInterval: intervalo });
  const ativ = useQuery({ queryKey: ["telao-ativ"], queryFn: () => getAtividade(5), refetchInterval: intervalo });
  const rank = useQuery({ queryKey: ["ranking"], queryFn: getRanking, refetchInterval: intervalo });
  const [agora, setAgora] = useState<Date | null>(null);
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(window.location.origin);
    setAgora(new Date());
    const html = document.documentElement;
    const anterior = html.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => {
      clearInterval(t);
      html.style.overflow = anterior;
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="grid h-dvh grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden bg-background p-4">
      <div className="grid min-h-0 grid-cols-[1.5fr_1fr] gap-3">
        <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-3">
          {feed.isPending ? (
            Array.from({ length: 6 }, (_, i) => <div key={i} className="animate-pulse rounded-2xl bg-muted" />)
          ) : feed.isError ? (
            <div className="col-span-3 row-span-2 flex items-center justify-center"><Erro erro={feed.error} onRetry={() => feed.refetch()} /></div>
          ) : feed.data.length === 0 ? (
            <div className="col-span-3 row-span-2"><Vazio texto="Nenhum post ainda" /></div>
          ) : (
            feed.data.slice(0, 6).map((p) => (
              <div key={p.id} className="animate-enter relative min-h-0 overflow-hidden rounded-2xl border bg-card">
                <img src={p.imagem_url} alt={p.legenda} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-background/85 p-2 backdrop-blur">
                  <Avatar src={p.perfil.avatar_url} alt={p.perfil.nome} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-[clamp(1rem,1.4vw,1.75rem)] font-semibold">@{p.perfil.handle}</p>
                    <p className="text-[clamp(0.85rem,1vw,1.25rem)] text-muted-foreground">{tempoRelativo(p.criado_em)}</p>
                  </div>
                </div>
                {p.origem === "agente" && <AgentBadge className="absolute right-2 top-2 text-sm" />}
              </div>
            ))
          )}
        </div>

        <div className="grid min-h-0 grid-rows-[minmax(0,1.35fr)_minmax(0,1fr)] gap-3">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card p-4">
            <h2 className="mb-2 flex shrink-0 items-center gap-3 text-[clamp(2rem,3.2vw,4.25rem)] font-bold leading-none">
              <span className="h-3 w-3 animate-pulse rounded-full bg-destructive" /> Ao vivo
            </h2>
            {ativ.isPending ? (
              <div className="flex-1 animate-pulse rounded-xl bg-muted" />
            ) : ativ.isError ? (
              <Erro erro={ativ.error} onRetry={() => ativ.refetch()} />
            ) : ativ.data.length === 0 ? (
              <Vazio texto="Nenhuma atividade" />
            ) : (
              <ul className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden">
                {ativ.data.slice(0, 3).map((a) => <AtividadeItem key={a.id} a={a} grande />)}
              </ul>
            )}
          </section>
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card p-4">
            <h2 className="mb-2 shrink-0 text-[clamp(1.75rem,2.6vw,3.5rem)] font-bold leading-none">Top 5</h2>
            {rank.isPending ? (
              <div className="flex-1 animate-pulse rounded-xl bg-muted" />
            ) : rank.isError ? (
              <Erro erro={rank.error} onRetry={() => rank.refetch()} />
            ) : rank.data.length === 0 ? (
              <Vazio texto="Nenhum grupo pontuou ainda" />
            ) : (
              <ol className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden">
                {rank.data.slice(0, 5).map((r) => (
                  <li key={r.grupo} className="flex min-w-0 items-baseline gap-3">
                    <span className="w-14 shrink-0 font-mono text-[clamp(1.35rem,2vw,2.5rem)] text-primary">{r.posicao}º</span>
                    <span className="min-w-0 flex-1 truncate text-[clamp(1.25rem,1.9vw,2.35rem)] font-semibold">
                      {r.grupo} <span className="font-normal text-muted-foreground">@{r.perfil_handle}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[clamp(1.5rem,2.2vw,2.75rem)] font-bold">{r.pontos}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-3">
        <div className="flex min-w-0 items-center gap-4">
          {url && <div className="shrink-0 rounded-md bg-foreground p-1.5"><QRCodeSVG value={url} size={84} /></div>}
          <div className="min-w-0">
            <p className="truncate font-display text-[clamp(1.5rem,2.2vw,3rem)] font-bold leading-none">fake<span className="text-primary">gram</span> · Oficina Langflow</p>
            <p className="mt-1 truncate font-mono text-sm text-muted-foreground">{url}</p>
          </div>
        </div>
        <p className="shrink-0 font-mono text-[clamp(2.25rem,4vw,5.5rem)] font-bold tabular-nums leading-none">{agora?.toLocaleTimeString("pt-BR") ?? "--:--:--"}</p>
      </footer>
    </div>
  );
}
