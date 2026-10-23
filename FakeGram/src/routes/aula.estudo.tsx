import { createFileRoute, Link } from "@tanstack/react-router";
import { MonitorPlay, Printer } from "lucide-react";
import { ProvedorAula, Rico, SlideConteudo } from "@/components/aula/slide";
import { BotaoKitEstudo } from "@/components/kit-estudo";
import { BLOCOS, SLIDES, type Slide } from "@/content/aula";
import { faixaDeMinutos } from "@/lib/aula";

export const Route = createFileRoute("/aula/estudo")({
  head: () => ({
    meta: [
      { title: "Material de estudo · Fakegram" },
      {
        name: "description",
        content: "Os slides da oficina de Langflow com a explicação e a teoria para revisar.",
      },
      { property: "og:title", content: "Material de estudo · Fakegram" },
      { property: "og:description", content: "Agentes, MCP e RAG, slide a slide." },
    ],
  }),
  component: Estudo,
});

function Indice() {
  return (
    <div className="space-y-4 text-sm">
      {BLOCOS.map((bloco) => (
        <div key={bloco.id}>
          <a href={`#${bloco.id}`} className="font-mono text-xs text-primary hover:underline">
            {bloco.titulo}
          </a>
          <ul className="mt-1 space-y-0.5">
            {SLIDES.filter((s) => s.bloco === bloco.id).map((slide) => (
              <li key={slide.id}>
                <a
                  href={`#${slide.id}`}
                  className="block truncate text-muted-foreground hover:text-foreground"
                >
                  {slide.titulo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Estudo() {
  return (
    <ProvedorAula
      value={{ modo: "documento", miniatura: false, revelado: null, fimCronometro: null }}
    >
      <div className="grid min-w-0 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Índice da aula" className="hidden lg:block print:hidden">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2">
            <Indice />
          </div>
        </nav>
        <div className="min-w-0 max-w-3xl space-y-12">
          <header>
            <p className="font-mono text-sm text-primary">Oficina Langflow · 2h30</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Material de estudo da aula</h1>
            <p className="mt-3 text-muted-foreground">
              Todos os slides, com a explicação dada em aula e a teoria para revisar. Os exercícios
              passo a passo estão em{" "}
              <Link
                to="/exercicios/$n"
                params={{ n: "1" }}
                className="text-primary hover:underline"
              >
                Exercícios
              </Link>
              , e o que fazer antes da aula está em{" "}
              <Link to="/preparar" className="text-primary hover:underline">
                Preparar
              </Link>
              .
            </p>
            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <Link
                to="/aula"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <MonitorPlay className="h-4 w-4" /> Ver como apresentação
              </Link>
              <BotaoKitEstudo />
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-secondary"
              >
                <Printer className="h-4 w-4" /> Salvar em PDF
              </button>
            </div>
            <details className="mt-5 rounded-xl border bg-card p-4 lg:hidden print:hidden">
              <summary className="cursor-pointer text-sm font-medium">Índice da aula</summary>
              <div className="mt-4">
                <Indice />
              </div>
            </details>
          </header>

          {BLOCOS.map((bloco) => (
            <section key={bloco.id} id={bloco.id} className="scroll-mt-20 space-y-5">
              <h2 className="flex flex-wrap items-baseline justify-between gap-x-4 border-b pb-2 text-2xl font-bold">
                <span>{bloco.titulo}</span>
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {faixaDeMinutos([bloco.inicio, bloco.fim])}
                </span>
              </h2>
              {SLIDES.filter((s) => s.bloco === bloco.id).map((slide) => (
                <SlideEstudo key={slide.id} slide={slide} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </ProvedorAula>
  );
}

function SlideEstudo({ slide }: { slide: Slide }) {
  return (
    <article
      id={slide.id}
      className="scroll-mt-20 break-inside-avoid rounded-2xl border bg-card p-5 md:p-6"
    >
      <p className="font-mono text-xs text-muted-foreground">
        {slide.id} · {faixaDeMinutos(slide.minutos)}
      </p>
      <h3 className="mt-1 text-xl font-bold md:text-2xl">{slide.titulo}</h3>
      <div className="mt-4 text-base">
        <SlideConteudo slide={slide} />
      </div>
      <div className="mt-5 space-y-3 border-t pt-4 text-sm leading-relaxed">
        <p>
          <span className="font-semibold">Explicação. </span>
          <span className="text-muted-foreground">{slide.fala}</span>
        </p>
        {slide.pergunte && (
          <p className="rounded-lg bg-primary/10 p-3">
            <span className="font-semibold">Para pensar: </span>
            {slide.pergunte}
          </p>
        )}
        {slide.revisar && (
          <div>
            <p className="font-semibold">Para revisar</p>
            <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-muted-foreground">
              {slide.revisar.map((item) => (
                <li key={item}>
                  <Rico texto={item} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
