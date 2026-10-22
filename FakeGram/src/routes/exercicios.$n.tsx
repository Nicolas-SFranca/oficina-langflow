import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { CodeBlock } from "@/components/fg";
import { EXERCICIOS } from "@/content/exercicios";
import { useChecks } from "@/lib/util";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exercicios/$n")({
  loader: ({ params }) => {
    const ex = EXERCICIOS.find((e) => String(e.n) === params.n);
    if (!ex) throw notFound();
    return ex;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Exercício ${loaderData.n}: ${loaderData.titulo} · Fakegram`
          : "Exercício · Fakegram",
      },
      { name: "description", content: loaderData?.resumo ?? "Guia de exercício da oficina." },
      {
        property: "og:title",
        content: loaderData ? `Exercício ${loaderData.n}: ${loaderData.titulo}` : "Exercício",
      },
      {
        property: "og:description",
        content: loaderData?.resumo ?? "Guia de exercício da oficina.",
      },
    ],
  }),
  component: ExercicioPage,
});

function ExercicioPage() {
  const ex = Route.useLoaderData();
  const [checks, toggle] = useChecks(`fakegram_ex${ex.n}`);
  const feitos = ex.passos.filter((_, i) => checks[i]).length;
  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[200px_1fr]">
      <nav className="flex gap-2 lg:flex-col">
        {EXERCICIOS.map((e) => (
          <Link
            key={e.n}
            to="/exercicios/$n"
            params={{ n: String(e.n) }}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-accent"
            activeProps={{ className: "border-primary text-primary" }}
          >
            <span className="font-mono">0{e.n}</span>{" "}
            <span className="hidden lg:inline">· {e.titulo}</span>
          </Link>
        ))}
      </nav>
      <div className="min-w-0 max-w-3xl">
        <p className="font-mono text-sm text-primary">
          Exercício {ex.n} · {ex.duracao}
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{ex.titulo}</h1>
        <p className="mt-2 text-muted-foreground">{ex.resumo}</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(feitos / ex.passos.length) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {feitos} de {ex.passos.length} passos
        </p>
        <ol className="mt-8 space-y-4">
          {ex.passos.map((p, i) => (
            <li
              key={i}
              className={cn("rounded-2xl border bg-card p-5 transition", checks[i] && "opacity-60")}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!checks[i]}
                  onChange={() => toggle(String(i))}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">
                    <span className="mr-2 font-mono text-primary">{i + 1}.</span>
                    {p.titulo}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.texto}</p>
                </div>
              </label>
              {p.codigo && (
                <div className="mt-3">
                  <CodeBlock codigo={p.codigo} />
                </div>
              )}
              {p.dica && (
                <p className="mt-3 flex gap-2 rounded-lg bg-primary/10 p-3 text-sm">
                  <Lightbulb className="h-4 w-4 shrink-0 text-primary" /> {p.dica}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
