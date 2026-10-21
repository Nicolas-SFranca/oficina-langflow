import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronLeft, ChevronRight, Maximize, PanelsTopLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Palco, ProvedorAula } from "@/components/aula/slide";
import { SLIDES } from "@/content/aula";
import { relogio, useAgora, useAulaSync, useTeclasAula } from "@/lib/aula";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aula/")({
  head: () => ({
    meta: [
      { title: "Aula · Fakegram" },
      { name: "description", content: "Apresentação da oficina de Langflow, MCP e RAG." },
      { property: "og:title", content: "Aula · Fakegram" },
      { property: "og:description", content: "Slides da oficina de agentes de IA." },
    ],
  }),
  component: Apresentacao,
});

function alternarTelaCheia() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
}

function abrirPainel() {
  window.open("/aula/apresentador", "fakegram-apresentador", "popup,width=1280,height=820");
}

function Apresentacao() {
  const { estado, atualizar, irPara } = useAulaSync();
  const agora = useAgora();
  const [controles, setControles] = useState(true);
  const toqueX = useRef<number | null>(null);
  const slide = SLIDES[estado.indice] ?? SLIDES[0]!;
  useTeclasAula(estado, irPara, atualizar, { f: alternarTelaCheia, p: abrirPainel });

  useEffect(() => {
    const html = document.documentElement;
    const anterior = html.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = anterior;
      document.body.style.overflow = "";
    };
  }, []);

  // Os botões somem depois de 2,5 s sem mexer o mouse, para não aparecerem no projetor.
  useEffect(() => {
    let espera: number | undefined;
    const mostrar = () => {
      setControles(true);
      window.clearTimeout(espera);
      espera = window.setTimeout(() => setControles(false), 2500);
    };
    mostrar();
    window.addEventListener("mousemove", mostrar);
    window.addEventListener("touchstart", mostrar);
    return () => {
      window.clearTimeout(espera);
      window.removeEventListener("mousemove", mostrar);
      window.removeEventListener("touchstart", mostrar);
    };
  }, []);

  const restante =
    estado.fimCronometro !== null && agora !== null ? (estado.fimCronometro - agora) / 1000 : null;
  const botao =
    "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground";

  return (
    <ProvedorAula
      value={{
        modo: "palco",
        miniatura: false,
        revelado: estado.revelado,
        fimCronometro: estado.fimCronometro,
      }}
    >
      <div
        className="fixed inset-0 bg-black"
        onTouchStart={(e) => {
          toqueX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const inicio = toqueX.current;
          const fim = e.changedTouches[0]?.clientX;
          toqueX.current = null;
          if (inicio === null || fim === undefined || Math.abs(fim - inicio) < 60) return;
          irPara(estado.indice + (fim < inicio ? 1 : -1));
        }}
      >
        <Palco slide={slide} className="h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${((estado.indice + 1) / SLIDES.length) * 100}%` }}
          />
        </div>
        {restante !== null && (
          <div
            className={cn(
              "absolute right-4 top-4 rounded-full border bg-background/90 px-4 py-1.5 font-mono text-lg font-semibold tabular-nums backdrop-blur",
              restante < 120 ? "text-destructive" : "text-primary",
            )}
          >
            ⏱ {restante > 0 ? relogio(restante) : "Tempo!"}
          </div>
        )}
        <nav
          aria-label="Controles da apresentação"
          className={cn(
            "absolute bottom-4 right-4 flex items-center gap-1 rounded-full border bg-background/90 p-1 backdrop-blur transition-opacity duration-300",
            controles ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <button
            type="button"
            className={botao}
            onClick={() => irPara(estado.indice - 1)}
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="px-1 font-mono text-xs text-muted-foreground tabular-nums">
            {estado.indice + 1}/{SLIDES.length}
          </span>
          <button
            type="button"
            className={botao}
            onClick={() => irPara(estado.indice + 1)}
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            className={botao}
            onClick={alternarTelaCheia}
            aria-label="Tela cheia (F)"
            title="Tela cheia (F)"
          >
            <Maximize className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={botao}
            onClick={abrirPainel}
            aria-label="Abrir painel do instrutor (P)"
            title="Painel do instrutor (P)"
          >
            <PanelsTopLeft className="h-4 w-4" />
          </button>
          <Link
            to="/aula/estudo"
            className={botao}
            aria-label="Material de estudo"
            title="Material de estudo"
          >
            <BookOpen className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </ProvedorAula>
  );
}
