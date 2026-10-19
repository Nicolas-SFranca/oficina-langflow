import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { Erro, PageTitle, SkeletonLinhas, Vazio } from "@/components/fg";
import { getRanking } from "@/lib/api";
import { useVisibleInterval } from "@/lib/util";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking · Fakegram" },
      { name: "description", content: "Pontuação dos grupos da oficina de agentes de IA." },
      { property: "og:title", content: "Ranking · Fakegram" },
      { property: "og:description", content: "Quem tem o agente mais afiado?" },
    ],
  }),
  component: Ranking,
});

function Ranking() {
  const intervalo = useVisibleInterval(10_000);
  const q = useQuery({ queryKey: ["ranking"], queryFn: getRanking, refetchInterval: intervalo });
  return (
    <div>
      <PageTitle titulo="Ranking" sub="Atualiza a cada 10 segundos." />
      {q.isPending ? <SkeletonLinhas n={6} /> : q.isError ? <Erro erro={q.error} onRetry={() => q.refetch()} /> : q.data.length === 0 ? <Vazio texto="Nenhum grupo pontuou ainda" /> : (
        <>
          <div className="mb-10 grid grid-cols-3 items-end gap-3">
            {[1, 0, 2].map((i) => {
              const r = q.data[i];
              if (!r) return <div key={i} />;
              return (
                <div key={r.grupo} className="min-w-0 text-center">
                  <Trophy className={cn("mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8", i === 0 ? "text-primary" : "text-muted-foreground")} />
                  <p className="truncate font-semibold">{r.grupo}</p>
                  <p className="truncate text-xs text-muted-foreground">@{r.perfil_handle}</p>
                  <div className={cn("mt-3 flex items-start justify-center rounded-t-xl border pt-3 font-mono text-2xl font-bold sm:pt-4 sm:text-3xl", i === 0 ? "h-28 border-primary bg-primary text-primary-foreground sm:h-40" : i === 1 ? "h-20 bg-card sm:h-28" : "h-16 bg-card sm:h-20")}>
                    {r.pontos}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>{["#", "Grupo", "Perfil", "Pontos", "Respostas", "Moderações corretas", "Posts"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {q.data.map((r) => (
                  <tr key={r.grupo} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-primary">{r.posicao}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{r.grupo}</td>
                    <td className="px-4 py-3"><Link to="/perfil/$handle" params={{ handle: r.perfil_handle }} className="hover:text-primary">@{r.perfil_handle}</Link></td>
                    <td className="px-4 py-3 font-mono font-bold">{r.pontos}</td>
                    <td className="px-4 py-3 font-mono">{r.respostas}</td>
                    <td className="px-4 py-3 font-mono">{r.moderacoes_corretas}</td>
                    <td className="px-4 py-3 font-mono">{r.posts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
