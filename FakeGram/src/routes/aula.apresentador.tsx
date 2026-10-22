import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MessageCircleQuestion,
  MonitorUp,
  Play,
  RotateCcw,
  Square,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Palco, ProvedorAula, Rico } from "@/components/aula/slide";
import { BLOCOS, SLIDES, blocoDoSlide, type Bloco, type Slide } from "@/content/aula";
import {
  faixaDeMinutos,
  relogio,
  useAgora,
  useAulaSync,
  useTeclasAula,
  type EstadoAula,
} from "@/lib/aula";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aula/apresentador")({
  head: () => ({
    meta: [
      { title: "Painel do instrutor · Fakegram" },
      { name: "description", content: "Notas, cronômetro e próximo slide da aula." },
    ],
  }),
  component: Apresentador,
});

const botao =
  "inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-40";

function abrirApresentacao() {
  window.open("/aula", "fakegram-apresentacao");
}

function Apresentador() {
  const { estado, atualizar, irPara } = useAulaSync();
  const agora = useAgora();
  useTeclasAula(estado, irPara, atualizar);
  const slide = SLIDES[estado.indice] ?? SLIDES[0]!;
  const proximo = SLIDES[estado.indice + 1];
  const temQuiz = slide.conteudo.some((b) => b.tipo === "quiz");

  return (
    <ProvedorAula
      value={{
        modo: "palco",
        miniatura: true,
        revelado: estado.revelado,
        fimCronometro: estado.fimCronometro,
      }}
    >
      <div className="min-h-dvh bg-background p-3 md:p-4 lg:h-dvh lg:overflow-hidden">
        <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
          <section className="flex min-h-0 min-w-0 flex-col gap-3">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono text-sm text-primary">
                {slide.id} · {estado.indice + 1}/{SLIDES.length}
              </span>
              <span className="text-sm text-muted-foreground">{blocoDoSlide(slide)?.titulo}</span>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <button
                  type="button"
                  className={botao}
                  onClick={() => irPara(estado.indice - 1)}
                  disabled={estado.indice === 0}
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <button
                  type="button"
                  className={cn(botao, "border-primary/50 text-primary")}
                  onClick={() => irPara(estado.indice + 1)}
                  disabled={estado.indice === SLIDES.length - 1}
                >
                  Próximo <ChevronRight className="h-4 w-4" />
                </button>
                {temQuiz && (
                  <button
                    type="button"
                    className={botao}
                    onClick={() => atualizar({ revelado: !estado.revelado })}
                  >
                    {estado.revelado ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {estado.revelado ? "Esconder" : "Revelar"}
                  </button>
                )}
                <button type="button" className={botao} onClick={abrirApresentacao}>
                  <MonitorUp className="h-4 w-4" /> Abrir apresentação
                </button>
              </div>
            </header>
            <Palco
              slide={slide}
              miniatura
              className="aspect-video w-full shrink-0 rounded-xl border"
            />
            <Notas slide={slide} />
          </section>

          <aside className="flex min-h-0 min-w-0 flex-col gap-3">
            <RelogioAula slide={slide} estado={estado} agora={agora} atualizar={atualizar} />
            <Cronometro slide={slide} estado={estado} agora={agora} atualizar={atualizar} />
            <div className="rounded-xl border bg-card p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Próximo:{" "}
                <span className="text-foreground">
                  {proximo ? `${proximo.id} · ${proximo.titulo}` : "fim da aula"}
                </span>
              </p>
              {proximo && (
                <Palco
                  slide={proximo}
                  miniatura
                  className="aspect-video w-full rounded-lg border"
                />
              )}
            </div>
            <ListaSlides atual={estado.indice} irPara={irPara} />
            <p className="hidden text-xs text-muted-foreground lg:block">
              Teclas: ← → mudam de slide · R revela o quiz · Home/End vão ao início e ao fim
            </p>
          </aside>
        </div>
      </div>
    </ProvedorAula>
  );
}

function Notas({ slide }: { slide: Slide }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    caixa.current?.scrollTo({ top: 0 });
  }, [slide.id]);
  return (
    <div
      ref={caixa}
      className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-xl border bg-card p-4 md:p-5"
    >
      <p className="text-lg leading-relaxed md:text-xl">{slide.fala}</p>
      {slide.pergunte && (
        <div className="flex gap-3 rounded-lg bg-primary/10 p-3">
          <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="leading-relaxed">
            <span className="font-semibold">Pergunte: </span>
            {slide.pergunte}
          </p>
        </div>
      )}
      {slide.acao && (
        <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p className="leading-relaxed">
            <Rico texto={slide.acao} />
          </p>
        </div>
      )}
      {slide.revisar && (
        <div>
          <p className="text-sm font-semibold">Para revisar</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
            {slide.revisar.map((item) => (
              <li key={item}>
                <Rico texto={item} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type PropsRelogio = {
  slide: Slide;
  estado: EstadoAula;
  agora: number | null;
  atualizar: (mudanca: Partial<EstadoAula>) => void;
};

/** Compara o tempo real da aula com o minuto planejado do slide. */
function RelogioAula({ slide, estado, agora, atualizar }: PropsRelogio) {
  if (estado.inicioAula === null || agora === null) {
    return (
      <div className="rounded-xl border bg-card p-3">
        <p className="text-sm text-muted-foreground">
          Planejado para este slide:{" "}
          <span className="font-mono text-foreground">{faixaDeMinutos(slide.minutos)}</span>
        </p>
        <button
          type="button"
          className={cn(botao, "mt-2 border-primary/50 text-primary")}
          onClick={() => atualizar({ inicioAula: Date.now() })}
        >
          <Play className="h-4 w-4" /> Começar a aula
        </button>
      </div>
    );
  }
  const minutos = (agora - estado.inicioAula) / 60000;
  const diferenca = minutos - slide.minutos[0];
  const status =
    diferenca > 3
      ? { texto: `${Math.round(diferenca)} min atrasado`, classe: "text-destructive" }
      : diferenca < -3
        ? { texto: `${Math.round(-diferenca)} min adiantado`, classe: "text-sky-400" }
        : { texto: "no tempo", classe: "text-primary" };
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-3">
      <div>
        <p className="font-mono text-3xl font-bold tabular-nums">{relogio(minutos * 60)}</p>
        <p className="text-xs text-muted-foreground">de aula · total 2:30:00</p>
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-muted-foreground">
          Planejado:{" "}
          <span className="font-mono text-foreground">{faixaDeMinutos(slide.minutos)}</span>
        </p>
        <p className={cn("font-semibold", status.classe)}>{status.texto}</p>
      </div>
      <button
        type="button"
        className={botao}
        onClick={() => atualizar({ inicioAula: null })}
        aria-label="Zerar o relógio da aula"
        title="Zerar o relógio da aula"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Cronômetro das práticas e do intervalo. Aparece também no canto do projetor. */
function Cronometro({ slide, estado, agora, atualizar }: PropsRelogio) {
  const cronometrado = slide.conteudo.find(
    (b): b is Extract<Bloco, { tipo: "pratica" | "intervalo" }> =>
      b.tipo === "pratica" || b.tipo === "intervalo",
  );
  if (estado.fimCronometro !== null && agora !== null) {
    const restante = (estado.fimCronometro - agora) / 1000;
    return (
      <div className="flex items-center gap-4 rounded-xl border border-primary/40 bg-primary/5 p-3">
        <Timer className="h-6 w-6 text-primary" />
        <p
          className={cn(
            "font-mono text-3xl font-bold tabular-nums",
            restante < 120 ? "text-destructive" : "text-primary",
          )}
        >
          {restante > 0 ? relogio(restante) : "Tempo!"}
        </p>
        <button
          type="button"
          className={cn(botao, "ml-auto")}
          onClick={() => atualizar({ fimCronometro: null })}
        >
          <Square className="h-4 w-4" /> Parar
        </button>
      </div>
    );
  }
  if (!cronometrado) return null;
  const nome = cronometrado.tipo === "pratica" ? "da prática" : "do intervalo";
  return (
    <button
      type="button"
      className={cn(botao, "justify-center border-primary/50 py-2.5 text-primary")}
      onClick={() => atualizar({ fimCronometro: Date.now() + cronometrado.minutos * 60_000 })}
    >
      <Timer className="h-4 w-4" /> Iniciar cronômetro {nome} ({cronometrado.minutos} min)
    </button>
  );
}

function ListaSlides({ atual, irPara }: { atual: number; irPara: (indice: number) => void }) {
  const lista = useRef<HTMLDivElement>(null);
  useEffect(() => {
    lista.current?.querySelector("[data-atual='true']")?.scrollIntoView({ block: "nearest" });
  }, [atual]);
  return (
    <div
      ref={lista}
      className="max-h-80 min-h-0 overflow-y-auto rounded-xl border bg-card p-2 lg:max-h-none lg:flex-1"
    >
      {BLOCOS.map((bloco) => (
        <div key={bloco.id} className="mb-2">
          <p className="px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-primary">
            {bloco.titulo}
          </p>
          {SLIDES.map((slide, indice) =>
            slide.bloco !== bloco.id ? null : (
              <button
                key={slide.id}
                type="button"
                data-atual={indice === atual}
                onClick={() => irPara(indice)}
                className={cn(
                  "flex w-full items-baseline gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-secondary",
                  indice === atual && "bg-primary/15 text-foreground",
                )}
              >
                <span className="font-mono text-xs text-muted-foreground">{slide.id}</span>
                <span className="min-w-0 flex-1 truncate">{slide.titulo}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {slide.minutos[0] < 0 ? "–" : slide.minutos[0]}
                </span>
              </button>
            ),
          )}
        </div>
      ))}
    </div>
  );
}
