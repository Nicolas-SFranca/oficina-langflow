import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Erro, PageTitle, SkeletonCards } from "@/components/fg";
import { getStatus } from "@/lib/api";
import { useChecks } from "@/lib/util";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status · Fakegram" },
      {
        name: "description",
        content: "Estado da API, banco e MCP, e checklist de preparação do aluno.",
      },
      { property: "og:title", content: "Status · Fakegram" },
      { property: "og:description", content: "Tudo pronto para a oficina?" },
    ],
  }),
  component: StatusPage,
});

const CHECKLIST = [
  "Langflow instalado e aberto em http://localhost:7860",
  "Chave de IA configurada em Model Providers",
  "Python 3.10+ instalado",
  "Kit baixado e descompactado",
];

function StatusPage() {
  const q = useQuery({ queryKey: ["status"], queryFn: getStatus });
  const [checks, toggle] = useChecks("fakegram_checklist");
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle titulo="Status" sub={q.data ? `Versão ${q.data.versao}` : ""} />
        <button
          onClick={() => q.refetch()}
          disabled={q.isFetching}
          className="mb-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", q.isFetching && "animate-spin")} /> Testar de novo
        </button>
      </div>
      {q.isPending ? (
        <SkeletonCards />
      ) : q.isError ? (
        <Erro erro={q.error} onRetry={() => q.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["API", q.data.api],
              ["Banco", q.data.banco],
              ["MCP", q.data.mcp],
            ] as const
          ).map(([nome, v]) => (
            <div
              key={nome}
              className={cn(
                "rounded-2xl border p-6",
                v === "ok"
                  ? "border-success/40 bg-success/10"
                  : "border-destructive/40 bg-destructive/10",
              )}
            >
              <p className="text-sm text-muted-foreground">{nome}</p>
              <p
                className={cn(
                  "mt-2 flex items-center gap-2 font-mono text-2xl font-bold",
                  v === "ok" ? "text-success" : "text-destructive",
                )}
              >
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    v === "ok" ? "bg-success" : "bg-destructive",
                  )}
                />{" "}
                {v}
              </p>
            </div>
          ))}
        </div>
      )}
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Meu checklist</h2>
        <ul className="space-y-3">
          {CHECKLIST.map((item) => (
            <li key={item}>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!checks[item]}
                  onChange={() => toggle(item)}
                  className="h-5 w-5 accent-primary"
                />
                <span className={cn(checks[item] && "text-muted-foreground line-through")}>
                  {item}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
