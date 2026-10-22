import { Check, Clock, Coffee, LifeBuoy, MonitorPlay, Target, type LucideIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Diagrama } from "@/components/aula/diagramas";
import { CodeBlock } from "@/components/fg";
import { SLIDES, blocoDoSlide, type Bloco, type Slide } from "@/content/aula";
import { relogio, tokenizar, useAgora } from "@/lib/aula";
import { cn } from "@/lib/utils";

/**
 * "palco" é o slide 16:9 do projetor; "documento" é a página de estudo, que
 * flui como texto. Os blocos usam medidas em em, então servem aos dois.
 */
type Ambiente = {
  modo: "palco" | "documento";
  /** Prévia no painel do instrutor: sem telão ao vivo e sem campos editáveis. */
  miniatura: boolean;
  /** null = cada quiz controla a própria resposta (página de estudo). */
  revelado: boolean | null;
  fimCronometro: number | null;
};

const AmbienteAula = createContext<Ambiente>({
  modo: "documento",
  miniatura: false,
  revelado: null,
  fimCronometro: null,
});

export const ProvedorAula = AmbienteAula.Provider;

/** Formata **negrito** e `código` dentro do texto dos slides. */
export function Rico({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {partes.map((parte, i) => {
        if (parte.length > 4 && parte.startsWith("**") && parte.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {parte.slice(2, -2)}
            </strong>
          );
        }
        if (parte.length > 2 && parte.startsWith("`") && parte.endsWith("`")) {
          return (
            <code
              key={i}
              className="whitespace-pre-wrap rounded-[0.25em] bg-secondary px-[0.3em] py-[0.05em] font-mono text-[0.85em] text-foreground"
            >
              {parte.slice(1, -1)}
            </code>
          );
        }
        return parte;
      })}
    </>
  );
}

const CORES_TOKEN = [
  "bg-primary/25",
  "bg-agent/40",
  "bg-sky-500/30",
  "bg-amber-500/30",
  "bg-rose-500/30",
];

function Tokenizador() {
  const { miniatura } = useContext(AmbienteAula);
  const [texto, setTexto] = useState(
    "O desenvolvimento de agentes de IA com Langflow é divertido!",
  );
  const tokens = tokenizar(texto);
  return (
    <div className="space-y-[0.5em]">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={miniatura}
        aria-label="Texto para dividir em tokens"
        className="w-full rounded-[0.4em] border bg-card px-[0.6em] py-[0.4em] text-[0.8em] outline-none focus:border-primary"
      />
      <div className="flex min-h-[2.5em] flex-wrap gap-y-[0.3em] rounded-[0.5em] border bg-card p-[0.6em] font-mono text-[0.72em] leading-relaxed">
        {tokens.map((token, i) => (
          <span
            key={i}
            className={cn("whitespace-pre rounded-[0.2em]", CORES_TOKEN[i % CORES_TOKEN.length])}
          >
            {token}
          </span>
        ))}
      </div>
      <p className="text-[0.68em] text-muted-foreground">
        ≈ <strong className="text-foreground">{tokens.length} tokens</strong> · {texto.length}{" "}
        caracteres · divisão aproximada, cada modelo tem o seu tokenizador
      </p>
    </div>
  );
}

function Quiz({ bloco }: { bloco: Extract<Bloco, { tipo: "quiz" }> }) {
  const ambiente = useContext(AmbienteAula);
  const [local, setLocal] = useState(false);
  const revelado = ambiente.revelado ?? local;
  return (
    <div className="space-y-[0.45em]">
      <p className="text-[0.9em] font-semibold leading-snug">
        <Rico texto={bloco.pergunta} />
      </p>
      <ol className="grid gap-[0.3em]">
        {bloco.opcoes.map((opcao, i) => {
          const certa = i === bloco.correta;
          return (
            <li
              key={opcao}
              className={cn(
                "flex items-center gap-[0.5em] rounded-[0.4em] border px-[0.6em] py-[0.3em] text-[0.75em] transition",
                revelado && certa && "border-primary bg-primary/15",
                revelado && !certa && "opacity-40",
              )}
            >
              <span className="font-mono font-semibold text-primary">{"ABCD"[i]}</span>
              <span>{opcao}</span>
              {revelado && certa && (
                <Check className="ml-auto h-[1em] w-[1em] shrink-0 text-primary" />
              )}
            </li>
          );
        })}
      </ol>
      {ambiente.revelado === null && (
        <button
          type="button"
          onClick={() => setLocal(!local)}
          className="text-[0.75em] text-primary underline-offset-4 hover:underline"
        >
          {local ? "Esconder resposta" : "Mostrar resposta"}
        </button>
      )}
    </div>
  );
}

function LinhaPratica({
  icone: Icone,
  rotulo,
  texto,
}: {
  icone: LucideIcon;
  rotulo: string;
  texto: string;
}) {
  return (
    <div className="flex gap-[0.6em]">
      <Icone className="mt-[0.2em] h-[1em] w-[1em] shrink-0 text-primary" />
      <p className="text-[0.9em] leading-snug">
        <span className="font-semibold">{rotulo}: </span>
        <Rico texto={texto} />
      </p>
    </div>
  );
}

function Intervalo({ bloco }: { bloco: Extract<Bloco, { tipo: "intervalo" }> }) {
  const ambiente = useContext(AmbienteAula);
  const agora = useAgora();
  const restante =
    ambiente.modo === "palco" && ambiente.fimCronometro !== null && agora !== null
      ? (ambiente.fimCronometro - agora) / 1000
      : null;
  return (
    <div className="flex flex-col items-center gap-[0.3em] text-center">
      <Coffee className="h-[2em] w-[2em] text-primary" />
      <p className="font-mono text-[3.2em] font-bold tabular-nums text-primary">
        {restante === null
          ? `${bloco.minutos} min`
          : restante > 0
            ? relogio(restante)
            : "Voltando!"}
      </p>
    </div>
  );
}

function Pratica({ bloco }: { bloco: Extract<Bloco, { tipo: "pratica" }> }) {
  const ambiente = useContext(AmbienteAula);
  const agora = useAgora();
  const restante =
    ambiente.modo === "palco" && ambiente.fimCronometro !== null && agora !== null
      ? (ambiente.fimCronometro - agora) / 1000
      : null;
  return (
    <div className="space-y-[0.7em] rounded-[0.8em] border-2 border-primary/60 bg-primary/5 p-[1em]">
      <div className="flex items-center justify-between gap-[1em]">
        <span className="inline-flex items-center gap-[0.4em] rounded-full bg-primary px-[0.7em] py-[0.2em] font-mono text-[0.75em] font-semibold text-primary-foreground">
          <Clock className="h-[1em] w-[1em]" /> {bloco.minutos} min
        </span>
        {restante !== null && (
          <span
            className={cn(
              "font-mono text-[1.6em] font-bold tabular-nums",
              restante < 120 ? "text-destructive" : "text-primary",
            )}
          >
            {restante > 0 ? relogio(restante) : "Tempo!"}
          </span>
        )}
      </div>
      <LinhaPratica icone={Target} rotulo="Objetivo" texto={bloco.objetivo} />
      <LinhaPratica icone={Check} rotulo="Deu certo se" texto={bloco.deuCerto} />
      {bloco.planoB && <LinhaPratica icone={LifeBuoy} rotulo="Plano B" texto={bloco.planoB} />}
    </div>
  );
}

function Qr({ bloco }: { bloco: Extract<Bloco, { tipo: "qr" }> }) {
  const interno = bloco.url.startsWith("/");
  const [url, setUrl] = useState(interno ? "" : bloco.url);
  useEffect(() => {
    if (interno) setUrl(window.location.origin + bloco.url);
  }, [interno, bloco.url]);
  return (
    <figure className="flex flex-col items-center gap-[0.5em]">
      <div className="rounded-[0.6em] bg-white p-[0.6em]">
        {url ? (
          <QRCodeSVG value={url} size={256} className="h-[8em] w-[8em]" />
        ) : (
          <div className="h-[8em] w-[8em]" />
        )}
      </div>
      <figcaption className="font-mono text-[0.7em] text-muted-foreground">
        {bloco.legenda}
      </figcaption>
    </figure>
  );
}

function Telao() {
  const { modo, miniatura } = useContext(AmbienteAula);
  if (modo === "palco" && !miniatura) {
    return (
      <div className="h-[17.5em] overflow-hidden rounded-[0.6em] border">
        <iframe src="/telao" title="Telão ao vivo do FakeGram" className="h-full w-full border-0" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-[0.8em] rounded-[0.6em] border bg-card p-[1em]">
      <MonitorPlay className="h-[1.4em] w-[1.4em] shrink-0 text-primary" />
      <div>
        <p className="font-semibold">Telão ao vivo</p>
        <p className="text-[0.8em] text-muted-foreground">
          Na aula, este slide mostra o telão do FakeGram com os agentes trabalhando.
        </p>
        {modo === "documento" && (
          <a href="/telao" className="text-[0.8em] text-primary hover:underline">
            Abrir o telão
          </a>
        )}
      </div>
    </div>
  );
}

function BlocoView({ bloco, duasColunas = false }: { bloco: Bloco; duasColunas?: boolean }) {
  const { modo } = useContext(AmbienteAula);
  switch (bloco.tipo) {
    case "texto":
      return (
        <p
          className={
            bloco.grande
              ? "font-display text-[1.5em] font-semibold leading-tight"
              : "text-[0.95em] leading-relaxed text-foreground/85"
          }
        >
          <Rico texto={bloco.texto} />
        </p>
      );
    case "lista": {
      const Tag = bloco.numerada ? "ol" : "ul";
      // Em duas colunas, a ordem segue de cima para baixo, como na lista normal.
      return (
        <Tag
          className={
            duasColunas ? "grid grid-flow-col gap-x-[1.5em] gap-y-[0.5em]" : "space-y-[0.5em]"
          }
          style={
            duasColunas
              ? { gridTemplateRows: `repeat(${Math.ceil(bloco.itens.length / 2)}, auto)` }
              : undefined
          }
        >
          {bloco.itens.map((item, i) => (
            <li key={i} className="flex gap-[0.6em] leading-snug">
              {bloco.numerada ? (
                <span className="mt-[0.1em] flex h-[1.6em] w-[1.6em] shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[0.75em] font-semibold text-primary-foreground">
                  {i + 1}
                </span>
              ) : (
                <span className="mt-[0.5em] h-[0.4em] w-[0.4em] shrink-0 rounded-full bg-primary" />
              )}
              <span className="min-w-0">
                <Rico texto={item} />
              </span>
            </li>
          ))}
        </Tag>
      );
    }
    case "tabela":
      return (
        <div className="overflow-x-auto rounded-[0.6em] border">
          <table className="w-full border-collapse text-left text-[0.78em]">
            <thead className="bg-secondary">
              <tr>
                {bloco.colunas.map((coluna) => (
                  <th key={coluna} className="px-[0.9em] py-[0.55em] font-semibold">
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloco.linhas.map((linha, i) => (
                <tr key={i} className="border-t">
                  {linha.map((celula, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-[0.9em] py-[0.5em] align-top",
                        j === 0 ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <Rico texto={celula} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "codigo":
      return modo === "palco" ? (
        <pre className="overflow-hidden whitespace-pre rounded-[0.5em] border bg-card p-[0.9em] font-mono text-[0.56em] leading-[1.55]">
          {bloco.codigo}
        </pre>
      ) : (
        <CodeBlock codigo={bloco.codigo} />
      );
    case "diagrama":
      // No celular o diagrama não encolhe até ficar ilegível: ganha rolagem lateral.
      return modo === "palco" ? (
        <Diagrama nome={bloco.nome} />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <Diagrama nome={bloco.nome} />
          </div>
        </div>
      );
    case "imagem":
      return (
        <figure className="flex justify-center">
          <div className="relative inline-block max-w-full">
            <img
              src={bloco.src}
              alt={bloco.alt}
              className={cn(
                "block h-auto max-w-full rounded-[0.5em] border",
                modo === "palco" && "max-h-[17em]",
              )}
            />
            {bloco.marcadores?.map((m) => (
              <span
                key={m.n}
                className="absolute flex h-[1.5em] w-[1.5em] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary font-mono text-[0.7em] font-bold text-primary-foreground shadow-lg ring-[0.2em] ring-background"
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              >
                {m.n}
              </span>
            ))}
          </div>
        </figure>
      );
    case "cartoes":
      return (
        <div
          className="grid gap-[0.6em]"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(11em, 1fr))" }}
        >
          {bloco.itens.map((cartao) => (
            <div key={cartao.titulo} className="rounded-[0.6em] border bg-card p-[0.8em]">
              <p className="font-display font-semibold text-primary">
                <Rico texto={cartao.titulo} />
              </p>
              <p className="mt-[0.3em] text-[0.78em] leading-snug text-muted-foreground">
                <Rico texto={cartao.texto} />
              </p>
            </div>
          ))}
        </div>
      );
    case "destaque":
      return (
        <blockquote className="border-l-[0.18em] border-primary pl-[0.8em]">
          <p className="font-display text-[1.2em] leading-snug">
            <Rico texto={bloco.texto} />
          </p>
          {bloco.autor && (
            <footer className="mt-[0.3em] text-[0.7em] text-muted-foreground">
              — {bloco.autor}
            </footer>
          )}
        </blockquote>
      );
    case "tokenizador":
      return <Tokenizador />;
    case "quiz":
      return <Quiz bloco={bloco} />;
    case "pratica":
      return <Pratica bloco={bloco} />;
    case "qr":
      return <Qr bloco={bloco} />;
    case "telao":
      return <Telao />;
    case "intervalo":
      return <Intervalo bloco={bloco} />;
  }
}

/** Os blocos do slide, um embaixo do outro ou lado a lado. */
export function SlideConteudo({ slide }: { slide: Slide }) {
  const { modo } = useContext(AmbienteAula);
  const n = slide.conteudo.length;
  const [primeiro, ...resto] = slide.conteudo;
  if (slide.primeiroNoTopo && primeiro && resto.length > 0) {
    const sozinho = resto.length === 1 ? resto[0] : undefined;
    return (
      <div className="flex flex-col gap-[0.9em]">
        <BlocoView bloco={primeiro} />
        {modo === "palco" && sozinho ? (
          <BlocoView bloco={sozinho} duasColunas={sozinho.tipo === "lista"} />
        ) : (
          <div
            className={cn(
              "grid",
              modo === "palco" ? "grid-cols-2 items-start gap-[1.2em]" : "gap-6 md:grid-cols-2",
            )}
          >
            {resto.map((bloco, i) => (
              <div key={i} className="min-w-0">
                <BlocoView bloco={bloco} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  const ladoALado = slide.colunas === true && n > 1;
  const mesmoTipo = slide.conteudo.every((b) => b.tipo === slide.conteudo[0]?.tipo);
  const colunasPalco = n === 3 && mesmoTipo ? 3 : 2;
  return (
    <div
      className={cn(
        !ladoALado && "flex flex-col gap-[0.9em]",
        ladoALado && modo === "palco" && "grid items-center gap-[1.2em]",
        ladoALado && modo === "documento" && "grid gap-6",
        ladoALado && modo === "documento" && n === 2 && "md:grid-cols-2 md:items-center",
      )}
      style={
        ladoALado && modo === "palco"
          ? { gridTemplateColumns: `repeat(${colunasPalco}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {slide.conteudo.map((bloco, i) => (
        <div key={i} className="min-w-0">
          <BlocoView bloco={bloco} />
        </div>
      ))}
    </div>
  );
}

/** Diminui o conteúdo quando ele passa da altura disponível no slide. */
function Encaixe({ children, className }: { children: ReactNode; className?: string }) {
  const fora = useRef<HTMLDivElement>(null);
  const dentro = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  useEffect(() => {
    const a = fora.current;
    const b = dentro.current;
    if (!a || !b || typeof ResizeObserver === "undefined") return;
    const medir = () => {
      const disponivel = a.clientHeight;
      const natural = b.offsetHeight;
      setEscala(natural > disponivel && natural > 0 ? Math.max(0.45, disponivel / natural) : 1);
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(a);
    observador.observe(b);
    return () => observador.disconnect();
  }, []);
  return (
    <div ref={fora} className={cn("flex flex-col justify-center", className)}>
      <div
        ref={dentro}
        style={
          escala < 1 ? { transform: `scale(${escala})`, transformOrigin: "center" } : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

/** O slide desenhado em 1280 × 720. Quem escala para a tela é o Palco. */
function SlideTela({ slide }: { slide: Slide }) {
  const bloco = blocoDoSlide(slide);
  const numero = SLIDES.indexOf(slide) + 1;
  const rodape = (
    <div className="absolute inset-x-[64px] bottom-[16px] flex justify-between font-mono text-[14px] text-muted-foreground/70">
      <span>
        fake<span className="text-primary">gram</span>/lab · Oficina Langflow
      </span>
      <span>
        {numero} / {SLIDES.length}
      </span>
    </div>
  );
  if (slide.capa) {
    return (
      <div className="lab-grid relative flex h-full w-full flex-col justify-center overflow-hidden bg-background px-[96px] text-foreground">
        <div className="absolute -right-[160px] -top-[160px] h-[520px] w-[520px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-[200px] left-[200px] h-[460px] w-[460px] rounded-full bg-agent/30 blur-[120px]" />
        <p className="relative font-mono text-[22px] text-primary">Oficina Langflow · 2h30</p>
        <h1 className="relative mt-[16px] font-display text-[96px] font-bold leading-[1.02] tracking-tight">
          {slide.titulo}
        </h1>
        <div className="relative mt-[28px] text-[30px] text-muted-foreground">
          <SlideConteudo slide={slide} />
        </div>
        {rodape}
      </div>
    );
  }
  return (
    <div
      className="lab-grid relative flex h-full w-full flex-col bg-background px-[64px] pb-[52px] pt-[40px] text-foreground"
      style={{ fontSize: 26 }}
    >
      <div className="flex items-center justify-between font-mono text-[16px] text-muted-foreground">
        <span className="text-primary">{bloco?.titulo}</span>
        <span>{slide.id}</span>
      </div>
      <h2 className="mt-[8px] font-display text-[50px] font-bold leading-[1.08] tracking-tight">
        {slide.titulo}
      </h2>
      <Encaixe className="mt-[22px] min-h-0 flex-1">
        <SlideConteudo slide={slide} />
      </Encaixe>
      {rodape}
    </div>
  );
}

/** Mostra o slide em 16:9, do maior tamanho que cabe na caixa. */
export function Palco({
  slide,
  miniatura = false,
  className,
}: {
  slide: Slide;
  miniatura?: boolean;
  className?: string;
}) {
  const pai = useContext(AmbienteAula);
  const caixa = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState({ escala: 0, x: 0, y: 0 });
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const medir = () => {
      const escala = Math.min(el.clientWidth / 1280, el.clientHeight / 720);
      setMedida({
        escala,
        x: (el.clientWidth - 1280 * escala) / 2,
        y: (el.clientHeight - 720 * escala) / 2,
      });
    };
    medir();
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);
  return (
    <div
      ref={caixa}
      className={cn("relative overflow-hidden", miniatura && "pointer-events-none", className)}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: 1280,
          height: 720,
          transform: `translate(${medida.x}px, ${medida.y}px) scale(${medida.escala})`,
          visibility: medida.escala > 0 ? "visible" : "hidden",
        }}
      >
        <AmbienteAula.Provider value={{ ...pai, modo: "palco", miniatura }}>
          <SlideTela key={slide.id} slide={slide} />
        </AmbienteAula.Provider>
      </div>
    </div>
  );
}
