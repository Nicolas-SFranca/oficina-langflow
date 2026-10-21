// Diagramas dos slides, desenhados em SVG com as cores do tema.
import { useEffect, useId, useState, type ReactNode } from "react";
import type { NomeDiagrama } from "@/content/aula";
import { cn } from "@/lib/utils";

type Ponto = [number, number];
type Cor = "padrao" | "primaria" | "agente" | "suave" | "alerta";
type FnSeta = (cor?: Cor) => string;

// Classes escritas por extenso para o Tailwind encontrar.
const CAIXA: Record<Cor, string> = {
  padrao: "fill-card stroke-muted-foreground/40",
  primaria: "fill-primary/15 stroke-primary",
  agente: "fill-agent/25 stroke-agent",
  suave: "fill-secondary stroke-muted-foreground/25",
  alerta: "fill-destructive/15 stroke-destructive",
};
const LINHA: Record<Cor, string> = {
  padrao: "stroke-muted-foreground/70",
  primaria: "stroke-primary",
  agente: "stroke-agent",
  suave: "stroke-muted-foreground/35",
  alerta: "stroke-destructive/60",
};
const PONTA: Record<Cor, string> = {
  padrao: "fill-muted-foreground/70",
  primaria: "fill-primary",
  agente: "fill-agent",
  suave: "fill-muted-foreground/35",
  alerta: "fill-destructive/60",
};
const CORES = Object.keys(LINHA) as Cor[];

function useReduzirMovimento() {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ler = () => setReduzir(consulta.matches);
    ler();
    consulta.addEventListener("change", ler);
    return () => consulta.removeEventListener("change", ler);
  }, []);
  return reduzir;
}

/** Atraso da animação de entrada, para os passos aparecerem em ordem. */
const entrada = (segundos: number) => ({ animationDelay: `${segundos}s` });

function Svg({
  altura,
  titulo,
  children,
}: {
  altura: number;
  titulo: string;
  children: (seta: FnSeta) => ReactNode;
}) {
  const base = useId().replace(/[^a-zA-Z0-9]/g, "");
  const seta: FnSeta = (cor = "padrao") => `url(#${base}-${cor})`;
  return (
    <svg
      viewBox={`0 0 1000 ${altura}`}
      role="img"
      aria-label={titulo}
      className="block h-auto w-full font-sans"
    >
      <defs>
        {CORES.map((cor) => (
          <marker
            key={cor}
            id={`${base}-${cor}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" className={PONTA[cor]} />
          </marker>
        ))}
      </defs>
      {children(seta)}
    </svg>
  );
}

function Caixa({
  x,
  y,
  w,
  h,
  titulo,
  linhas = [],
  cor = "padrao",
  tamanho = 21,
  mono = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  titulo: string;
  linhas?: string[];
  cor?: Cor;
  tamanho?: number;
  mono?: boolean;
}) {
  const alturaTexto = tamanho + 4 + linhas.length * 21;
  const topo = y + h / 2 - alturaTexto / 2 + tamanho - 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} strokeWidth={2} className={CAIXA[cor]} />
      <text
        x={x + w / 2}
        y={topo}
        textAnchor="middle"
        fontSize={tamanho}
        className="fill-foreground font-display font-semibold"
      >
        {titulo}
      </text>
      {linhas.map((linha, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={topo + 25 + i * 21}
          textAnchor="middle"
          fontSize={15.5}
          className={cn("fill-muted-foreground", mono && "font-mono")}
        >
          {linha}
        </text>
      ))}
    </g>
  );
}

function Seta({
  d,
  seta,
  cor = "padrao",
  tracejada = false,
  fluir = false,
}: {
  d: string;
  seta: FnSeta;
  cor?: Cor;
  tracejada?: boolean;
  fluir?: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      strokeWidth={2.5}
      strokeDasharray={tracejada ? "7 7" : undefined}
      markerEnd={seta(cor)}
      className={cn(LINHA[cor], fluir && "motion-safe:aula-fluir")}
    />
  );
}

function Texto({
  x,
  y,
  children,
  tamanho = 16,
  ancora = "middle",
  classe = "fill-muted-foreground",
}: {
  x: number;
  y: number;
  children: ReactNode;
  tamanho?: number;
  ancora?: "start" | "middle" | "end";
  classe?: string;
}) {
  return (
    <text x={x} y={y} textAnchor={ancora} fontSize={tamanho} className={classe}>
      {children}
    </text>
  );
}

function Cilindro({
  x,
  y,
  w,
  h,
  cor = "agente",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  cor?: Cor;
}) {
  const rx = w / 2;
  const ry = 16;
  return (
    <g>
      <path
        d={`M${x} ${y + ry} v${h - 2 * ry} a${rx} ${ry} 0 0 0 ${w} 0 v${-(h - 2 * ry)}`}
        strokeWidth={2}
        className={CAIXA[cor]}
      />
      <ellipse cx={x + rx} cy={y + ry} rx={rx} ry={ry} strokeWidth={2} className={CAIXA[cor]} />
    </g>
  );
}

// ── Componentes do Langflow desenhados ──────────────────────────────────

type LinhaNo = { rotulo: string; porta?: "entrada" | "saida"; cor?: Cor; campo?: boolean };
type No = { x: number; y: number; w: number; titulo: string; linhas: LinhaNo[]; cor?: Cor };

const CABECALHO = 36;
const LINHA_NO = 28;
const alturaNo = (no: No) => CABECALHO + no.linhas.length * LINHA_NO + 8;
const yLinha = (no: No, i: number) => no.y + CABECALHO + i * LINHA_NO + LINHA_NO / 2;
const entradaNo = (no: No, i: number): Ponto => [no.x, yLinha(no, i)];
const saidaNo = (no: No, i: number): Ponto => [no.x + no.w, yLinha(no, i)];

function curva([x1, y1]: Ponto, [x2, y2]: Ponto) {
  const meio = (x1 + x2) / 2;
  return `M${x1} ${y1} C${meio} ${y1} ${meio} ${y2} ${x2} ${y2}`;
}

const PORTA: Record<Cor, string> = {
  padrao: "fill-muted-foreground",
  primaria: "fill-primary",
  agente: "fill-agent",
  suave: "fill-muted-foreground",
  alerta: "fill-destructive",
};

function NoFluxo({ no }: { no: No }) {
  return (
    <g>
      <rect
        x={no.x}
        y={no.y}
        width={no.w}
        height={alturaNo(no)}
        rx={12}
        strokeWidth={2}
        className={no.cor ? CAIXA[no.cor] : "fill-card stroke-muted-foreground/40"}
      />
      <text x={no.x + 14} y={no.y + 25} fontSize={19} className="fill-foreground font-semibold">
        {no.titulo}
      </text>
      <line
        x1={no.x}
        y1={no.y + CABECALHO}
        x2={no.x + no.w}
        y2={no.y + CABECALHO}
        className="stroke-muted-foreground/25"
      />
      {no.linhas.map((linha, i) => {
        const cy = yLinha(no, i);
        const saida = linha.porta === "saida";
        return (
          <g key={i}>
            {linha.campo && (
              <rect
                x={no.x + 10}
                y={cy - 11}
                width={no.w - 20}
                height={22}
                rx={5}
                className="fill-secondary"
              />
            )}
            <text
              x={saida ? no.x + no.w - 16 : no.x + 16}
              y={cy + 5}
              textAnchor={saida ? "end" : "start"}
              fontSize={15}
              className={cn("fill-muted-foreground", linha.campo && "font-mono")}
            >
              {linha.rotulo}
            </text>
            {linha.porta && (
              <circle
                cx={saida ? no.x + no.w : no.x}
                cy={cy}
                r={6}
                className={PORTA[linha.cor ?? "primaria"]}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

// ── Diagramas ───────────────────────────────────────────────────────────

const CIRCULO_TRILHA = {
  suave: "fill-secondary stroke-muted-foreground/40",
  primaria: "fill-primary stroke-primary",
  agente: "fill-agent stroke-agent",
} as const;

function Trilha() {
  const paradas = [
    { marca: "T1", rotulo: ["O que é", "um agente"], cor: "suave" },
    { marca: "P1", rotulo: ["Primeiro", "agente"], cor: "primaria" },
    { marca: "T2", rotulo: ["MCP"], cor: "suave" },
    { marca: "P2", rotulo: ["Agente no", "FakeGram"], cor: "primaria" },
    { marca: "T3", rotulo: ["RAG"], cor: "suave" },
    { marca: "P3", rotulo: ["O seu", "MCP"], cor: "primaria" },
    { marca: "🏆", rotulo: ["Ranking"], cor: "agente" },
  ] as const;
  return (
    <Svg altura={180} titulo="Trilha da aula: três teorias, três práticas e o ranking no fim">
      {() => (
        <>
          <line
            x1={70}
            y1={52}
            x2={930}
            y2={52}
            strokeWidth={4}
            strokeLinecap="round"
            className="stroke-muted-foreground/30"
          />
          {paradas.map((parada, i) => {
            const x = 70 + i * (860 / 6);
            return (
              <g key={parada.marca} className="motion-safe:aula-surgir" style={entrada(i * 0.12)}>
                <circle
                  cx={x}
                  cy={52}
                  r={30}
                  strokeWidth={3}
                  className={CIRCULO_TRILHA[parada.cor]}
                />
                <text
                  x={x}
                  y={59}
                  textAnchor="middle"
                  fontSize={20}
                  className={cn(
                    "font-display font-bold",
                    parada.cor === "primaria" ? "fill-primary-foreground" : "fill-foreground",
                  )}
                >
                  {parada.marca}
                </text>
                {parada.rotulo.map((linha, j) => (
                  <Texto
                    key={linha}
                    x={x}
                    y={114 + j * 22}
                    tamanho={18}
                    classe={parada.cor === "suave" ? "fill-muted-foreground" : "fill-foreground"}
                  >
                    {linha}
                  </Texto>
                ))}
              </g>
            );
          })}
        </>
      )}
    </Svg>
  );
}

function ProximoToken() {
  const opcoes = [
    ["quente", 62],
    ["pronto", 21],
    ["frio", 9],
  ] as const;
  return (
    <Svg altura={240} titulo="O modelo dá uma probabilidade para cada próximo pedaço de texto">
      {() => (
        <>
          <text x={30} y={134} fontSize={40} className="fill-foreground font-display font-semibold">
            O café está
          </text>
          <rect
            x={258}
            y={100}
            width={4}
            height={44}
            className="fill-primary motion-safe:animate-pulse"
          />
          {opcoes.map(([palavra, pct], i) => {
            const y = 36 + i * 66;
            const largura = (pct / 100) * 520;
            return (
              <g key={palavra}>
                <text
                  x={300}
                  y={y + 31}
                  fontSize={26}
                  className={i === 0 ? "fill-primary font-semibold" : "fill-muted-foreground"}
                >
                  {palavra}
                </text>
                <rect
                  x={420}
                  y={y}
                  width={largura}
                  height={44}
                  rx={8}
                  style={entrada(i * 0.15)}
                  className={cn(
                    i === 0 ? "fill-primary" : "fill-muted-foreground/35",
                    "motion-safe:aula-crescer",
                  )}
                />
                <Texto
                  x={434 + largura}
                  y={y + 30}
                  tamanho={22}
                  ancora="start"
                  classe="fill-foreground font-mono"
                >
                  {pct}%
                </Texto>
              </g>
            );
          })}
        </>
      )}
    </Svg>
  );
}

function ChatbotAgente() {
  return (
    <Svg
      altura={290}
      titulo="Chatbot responde e acaba; o agente recebe um objetivo e repete um ciclo"
    >
      {(seta) => (
        <>
          <rect
            x={10}
            y={10}
            width={460}
            height={270}
            rx={18}
            strokeWidth={2}
            className={CAIXA.suave}
          />
          <Texto x={240} y={52} tamanho={26} classe="fill-foreground font-display font-bold">
            Chatbot
          </Texto>
          <Caixa x={40} y={110} w={170} h={70} titulo="Pergunta" />
          <Seta d="M210 145 L266 145" seta={seta} />
          <Caixa x={270} y={110} w={170} h={70} titulo="Resposta" />
          <Texto x={240} y={240} tamanho={18}>
            e acabou.
          </Texto>

          <rect
            x={500}
            y={10}
            width={490}
            height={270}
            rx={18}
            strokeWidth={2}
            className="fill-agent/10 stroke-agent/40"
          />
          <Texto x={745} y={52} tamanho={26} classe="fill-foreground font-display font-bold">
            Agente
          </Texto>
          <Caixa x={518} y={115} w={112} h={60} titulo="Objetivo" cor="primaria" tamanho={19} />
          <Seta d="M630 145 L666 145" seta={seta} />
          <Caixa
            x={670}
            y={78}
            w={168}
            h={134}
            titulo="Ciclo"
            linhas={["planeja", "usa ferramentas", "confere"]}
            cor="agente"
          />
          <Seta d="M838 145 L866 145" seta={seta} />
          <Caixa x={870} y={115} w={106} h={60} titulo="Resposta" tamanho={18} />
          <Texto x={745} y={250} tamanho={18}>
            repete até cumprir o objetivo
          </Texto>
        </>
      )}
    </Svg>
  );
}

function CicloAgente() {
  const reduzir = useReduzirMovimento();
  return (
    <Svg
      altura={420}
      titulo="Ciclo do agente: pensar, agir chamando uma ferramenta, observar o resultado e repetir"
    >
      {(seta) => (
        <>
          <circle
            cx={500}
            cy={225}
            r={140}
            fill="none"
            strokeDasharray="4 8"
            className="stroke-muted-foreground/25"
          />
          {!reduzir && (
            <circle r={9} className="fill-primary">
              <animateMotion
                dur="6s"
                repeatCount="indefinite"
                path="M500 85 A140 140 0 1 1 499.9 85"
              />
            </circle>
          )}
          <Seta d="M607.2 135 A140 140 0 0 1 639.5 237.2" seta={seta} cor="primaria" />
          <Seta d="M547.9 356.6 A140 140 0 0 1 452.1 356.6" seta={seta} cor="agente" />
          <Seta d="M360.5 212.8 A140 140 0 0 1 392.8 135" seta={seta} cor="padrao" />

          <Caixa
            x={405}
            y={50}
            w={190}
            h={70}
            titulo="Pensar"
            linhas={["qual o próximo passo?"]}
            cor="primaria"
          />
          <Caixa
            x={526}
            y={260}
            w={190}
            h={70}
            titulo="Agir"
            linhas={["chama uma ferramenta"]}
            cor="agente"
          />
          <Caixa x={284} y={260} w={190} h={70} titulo="Observar" linhas={["lê o resultado"]} />

          <Caixa x={30} y={55} w={200} h={60} titulo="Objetivo" cor="suave" />
          <Seta d="M230 85 L401 85" seta={seta} />
          <Seta d="M595 85 L766 85" seta={seta} cor="primaria" />
          <Texto x={680} y={72} tamanho={15}>
            já sei a resposta
          </Texto>
          <Caixa x={770} y={55} w={200} h={60} titulo="Responder" cor="primaria" />

          <Texto x={500} y={222} tamanho={17}>
            repete até
          </Texto>
          <Texto x={500} y={244} tamanho={17}>
            saber responder
          </Texto>
          <Texto x={500} y={405} tamanho={18} classe="fill-agent">
            cada volta manda o contexto inteiro de novo para o modelo
          </Texto>
        </>
      )}
    </Svg>
  );
}

function BuscaWeb() {
  const passos: { titulo: string; linhas: string[]; cor: Cor; mono?: boolean }[] = [
    { titulo: "Pergunta", linhas: ["Qual a versão", "mais nova do", "Langflow?"], cor: "padrao" },
    {
      titulo: "Modelo decide",
      linhas: ["não sei →", "web_search(", '"versão Langflow")'],
      cor: "primaria",
      mono: true,
    },
    { titulo: "Buscador", linhas: ["devolve títulos,", "trechos e links"], cor: "agente" },
    { titulo: "Lê a página", linhas: ["ler_url(link)", "se o trecho", "não basta"], cor: "agente" },
    {
      titulo: "Resposta",
      linhas: ["escrita pelo", "modelo, com a", "fonte citada"],
      cor: "primaria",
    },
  ];
  return (
    <Svg altura={300} titulo="Como o agente busca na internet, em cinco passos">
      {(seta) => (
        <>
          {passos.map((passo, i) => {
            const x = 20 + i * 198;
            return (
              <g key={passo.titulo} className="motion-safe:aula-surgir" style={entrada(i * 0.25)}>
                <Caixa
                  x={x}
                  y={60}
                  w={168}
                  h={150}
                  titulo={passo.titulo}
                  linhas={passo.linhas}
                  cor={passo.cor}
                  tamanho={19}
                  mono={passo.mono ?? false}
                />
                <circle
                  cx={x + 6}
                  cy={60}
                  r={18}
                  className="fill-background stroke-muted-foreground/50"
                  strokeWidth={2}
                />
                <Texto
                  x={x + 6}
                  y={66}
                  tamanho={17}
                  classe="fill-foreground font-mono font-semibold"
                >
                  {i + 1}
                </Texto>
                {i < passos.length - 1 && (
                  <Seta d={`M${x + 170} 135 L${x + 196} 135`} seta={seta} />
                )}
              </g>
            );
          })}
          <rect x={300} y={256} width={18} height={18} rx={4} className="fill-primary" />
          <Texto x={326} y={271} ancora="start">
            modelo (pensa)
          </Texto>
          <rect x={520} y={256} width={18} height={18} rx={4} className="fill-agent" />
          <Texto x={546} y={271} ancora="start">
            ferramenta (programa comum)
          </Texto>
        </>
      )}
    </Svg>
  );
}

function AnatomiaComponente() {
  return (
    <Svg
      altura={420}
      titulo="Partes de um componente: portas, campos, Tool Mode e o botão de executar"
    >
      {() => (
        <>
          <rect
            x={330}
            y={30}
            width={340}
            height={360}
            rx={16}
            strokeWidth={2}
            className="fill-card stroke-muted-foreground/50"
          />
          <rect x={350} y={52} width={28} height={28} rx={7} className="fill-agent" />
          <Texto
            x={392}
            y={74}
            tamanho={24}
            ancora="start"
            classe="fill-foreground font-display font-semibold"
          >
            Agent
          </Texto>
          <rect x={530} y={56} width={52} height={26} rx={13} className="fill-primary" />
          <circle cx={569} cy={69} r={10} className="fill-primary-foreground" />
          <circle cx={636} cy={69} r={17} className="fill-secondary" />
          <path d="M630 60 L645 69 L630 78 z" className="fill-foreground" />
          <line x1={330} y1={98} x2={670} y2={98} className="stroke-muted-foreground/25" />

          <Texto x={350} y={130} tamanho={14} ancora="start">
            Language Model
          </Texto>
          <rect x={350} y={140} width={300} height={36} rx={7} className="fill-secondary" />
          <Texto x={364} y={164} tamanho={15} ancora="start" classe="fill-foreground font-mono">
            gemini-flash-latest
          </Texto>
          <Texto x={350} y={208} tamanho={14} ancora="start">
            Agent Instructions
          </Texto>
          <rect x={350} y={218} width={300} height={36} rx={7} className="fill-secondary" />
          <Texto x={364} y={242} tamanho={15} ancora="start" classe="fill-foreground font-mono">
            Você é um assistente…
          </Texto>

          <circle cx={330} cy={290} r={8} className="fill-agent" />
          <Texto x={350} y={296} tamanho={17} ancora="start" classe="fill-foreground">
            Tools
          </Texto>
          <circle cx={330} cy={330} r={8} className="fill-primary" />
          <Texto x={350} y={336} tamanho={17} ancora="start" classe="fill-foreground">
            Input
          </Texto>
          <circle cx={670} cy={360} r={8} className="fill-primary" />
          <Texto x={650} y={366} tamanho={17} ancora="end" classe="fill-foreground">
            Response
          </Texto>

          <g className="stroke-muted-foreground/60" strokeWidth={1.5} strokeDasharray="4 4">
            <line x1={262} y1={310} x2={318} y2={310} />
            <line x1={262} y1={160} x2={344} y2={160} />
            <line x1={696} y1={52} x2={652} y2={62} />
            <line x1={696} y1={132} x2={570} y2={86} />
            <line x1={696} y1={360} x2={682} y2={360} />
          </g>
          <Texto x={255} y={304} tamanho={19} ancora="end" classe="fill-foreground font-semibold">
            Portas de entrada
          </Texto>
          <Texto x={255} y={328} tamanho={15} ancora="end">
            a cor é o tipo de dado
          </Texto>
          <Texto x={255} y={154} tamanho={19} ancora="end" classe="fill-foreground font-semibold">
            Campos
          </Texto>
          <Texto x={255} y={178} tamanho={15} ancora="end">
            configuração do componente
          </Texto>
          <Texto x={704} y={50} tamanho={19} ancora="start" classe="fill-foreground font-semibold">
            ▶ Executar
          </Texto>
          <Texto x={704} y={74} tamanho={15} ancora="start">
            roda só este componente
          </Texto>
          <Texto x={704} y={130} tamanho={19} ancora="start" classe="fill-foreground font-semibold">
            Tool Mode
          </Texto>
          <Texto x={704} y={154} tamanho={15} ancora="start">
            vira ferramenta (saída Toolset)
          </Texto>
          <Texto x={704} y={356} tamanho={19} ancora="start" classe="fill-foreground font-semibold">
            Porta de saída
          </Texto>
          <Texto x={704} y={380} tamanho={15} ancora="start">
            liga no próximo componente
          </Texto>
        </>
      )}
    </Svg>
  );
}

function FluxoSimples() {
  const chatInput: No = {
    x: 30,
    y: 40,
    w: 200,
    titulo: "Chat Input",
    linhas: [{ rotulo: "Chat Message", porta: "saida" }],
  };
  const prompt: No = {
    x: 30,
    y: 190,
    w: 200,
    titulo: "Prompt Template",
    linhas: [
      { rotulo: "tom: bem-humorado", campo: true },
      { rotulo: "Prompt", porta: "saida" },
    ],
  };
  const modelo: No = {
    x: 390,
    y: 80,
    w: 240,
    titulo: "Language Model",
    linhas: [
      { rotulo: "Input", porta: "entrada" },
      { rotulo: "System Message", porta: "entrada" },
      { rotulo: "gemini-flash-latest", campo: true },
      { rotulo: "Model Response", porta: "saida" },
    ],
  };
  const chatOutput: No = {
    x: 770,
    y: 170,
    w: 200,
    titulo: "Chat Output",
    linhas: [{ rotulo: "Inputs", porta: "entrada" }],
  };
  return (
    <Svg
      altura={300}
      titulo="Fluxo simples: Chat Input e Prompt Template ligados no Language Model, que responde no Chat Output"
    >
      {() => (
        <>
          <path
            d={curva(saidaNo(chatInput, 0), entradaNo(modelo, 0))}
            fill="none"
            strokeWidth={3}
            className="stroke-primary motion-safe:aula-fluir"
          />
          <path
            d={curva(saidaNo(prompt, 1), entradaNo(modelo, 1))}
            fill="none"
            strokeWidth={3}
            className="stroke-primary motion-safe:aula-fluir"
          />
          <path
            d={curva(saidaNo(modelo, 3), entradaNo(chatOutput, 0))}
            fill="none"
            strokeWidth={3}
            className="stroke-primary motion-safe:aula-fluir"
          />
          <NoFluxo no={chatInput} />
          <NoFluxo no={prompt} />
          <NoFluxo no={modelo} />
          <NoFluxo no={chatOutput} />
        </>
      )}
    </Svg>
  );
}

function FluxoAgente() {
  const ferramentas = ["Calculator", "Current Date", "Web Search", "URL"].map((titulo, i): No => ({
    x: 20,
    y: 110 + i * 82,
    w: 200,
    titulo,
    linhas: [{ rotulo: "Toolset", porta: "saida", cor: "agente" }],
  }));
  const chatInput: No = {
    x: 290,
    y: 20,
    w: 190,
    titulo: "Chat Input",
    linhas: [{ rotulo: "Chat Message", porta: "saida" }],
  };
  const agente: No = {
    x: 560,
    y: 120,
    w: 220,
    titulo: "Agent",
    cor: "agente",
    linhas: [
      { rotulo: "Agent Instructions", campo: true },
      { rotulo: "Tools", porta: "entrada", cor: "agente" },
      { rotulo: "Input", porta: "entrada" },
      { rotulo: "gemini-flash-latest", campo: true },
      { rotulo: "Response", porta: "saida" },
    ],
  };
  const chatOutput: No = {
    x: 820,
    y: 250,
    w: 160,
    titulo: "Chat Output",
    linhas: [{ rotulo: "Inputs", porta: "entrada" }],
  };
  return (
    <Svg
      altura={450}
      titulo="Fluxo de agente: quatro ferramentas em Tool Mode ligadas na entrada Tools do Agent"
    >
      {() => (
        <>
          {ferramentas.map((no) => (
            <path
              key={no.titulo}
              d={curva(saidaNo(no, 0), entradaNo(agente, 1))}
              fill="none"
              strokeWidth={3}
              className="stroke-agent motion-safe:aula-fluir"
            />
          ))}
          <path
            d={curva(saidaNo(chatInput, 0), entradaNo(agente, 2))}
            fill="none"
            strokeWidth={3}
            className="stroke-primary motion-safe:aula-fluir"
          />
          <path
            d={curva(saidaNo(agente, 4), entradaNo(chatOutput, 0))}
            fill="none"
            strokeWidth={3}
            className="stroke-primary motion-safe:aula-fluir"
          />
          {ferramentas.map((no) => (
            <NoFluxo key={no.titulo} no={no} />
          ))}
          <NoFluxo no={chatInput} />
          <NoFluxo no={agente} />
          <NoFluxo no={chatOutput} />
          <Texto x={120} y={96} tamanho={15} classe="fill-agent">
            Tool Mode ligado
          </Texto>
        </>
      )}
    </Svg>
  );
}

function FluxoMcp() {
  const chatInput: No = {
    x: 20,
    y: 40,
    w: 190,
    titulo: "Chat Input",
    linhas: [{ rotulo: "Chat Message", porta: "saida" }],
  };
  const mcp: No = {
    x: 20,
    y: 190,
    w: 220,
    titulo: "MCP Tools",
    cor: "agente",
    linhas: [
      { rotulo: "servidor: fakegram", campo: true },
      { rotulo: "Toolset", porta: "saida", cor: "agente" },
    ],
  };
  const agente: No = {
    x: 360,
    y: 80,
    w: 220,
    titulo: "Agent",
    linhas: [
      { rotulo: "instruções do kit", campo: true },
      { rotulo: "Tools", porta: "entrada", cor: "agente" },
      { rotulo: "Input", porta: "entrada" },
      { rotulo: "Response", porta: "saida" },
    ],
  };
  const chatOutput: No = {
    x: 690,
    y: 150,
    w: 180,
    titulo: "Chat Output",
    linhas: [{ rotulo: "Inputs", porta: "entrada" }],
  };
  const fimMcp = mcp.y + alturaNo(mcp);
  return (
    <Svg
      altura={430}
      titulo="O MCP Tools conecta o servidor do FakeGram ao Agent, com o token do grupo no header"
    >
      {(seta) => (
        <>
          <path
            d={curva(saidaNo(chatInput, 0), entradaNo(agente, 2))}
            fill="none"
            strokeWidth={3}
            className="stroke-primary motion-safe:aula-fluir"
          />
          <path
            d={curva(saidaNo(mcp, 1), entradaNo(agente, 1))}
            fill="none"
            strokeWidth={3}
            className="stroke-agent motion-safe:aula-fluir"
          />
          <path
            d={curva(saidaNo(agente, 3), entradaNo(chatOutput, 0))}
            fill="none"
            strokeWidth={3}
            className="stroke-primary motion-safe:aula-fluir"
          />
          <NoFluxo no={chatInput} />
          <NoFluxo no={mcp} />
          <NoFluxo no={agente} />
          <NoFluxo no={chatOutput} />
          <Seta d={`M130 ${fimMcp + 2} L130 ${fimMcp + 44}`} seta={seta} cor="agente" tracejada />
          <Caixa
            x={20}
            y={fimMcp + 48}
            w={420}
            h={70}
            titulo="FakeGram · /mcp"
            linhas={["Authorization: Bearer <token do grupo>"]}
            cor="agente"
            mono
          />
        </>
      )}
    </Svg>
  );
}

function NxM() {
  const apps = ["Langflow", "Claude", "Cursor", "ChatGPT"];
  const sistemas = ["GitHub", "Banco", "Drive", "Slack", "FakeGram"];
  const yApp = (i: number) => 50 + i * 62;
  const ySis = (i: number) => 30 + i * 62;
  return (
    <Svg
      altura={370}
      titulo="Sem padrão, 4 aplicativos e 5 sistemas precisam de 20 integrações; com MCP, 9 conexões"
    >
      {() => (
        <>
          {apps.map((_, a) =>
            sistemas.map((__, s) => (
              <line
                key={`${a}-${s}`}
                x1={160}
                y1={yApp(a) + 20}
                x2={300}
                y2={ySis(s) + 20}
                strokeWidth={2}
                className="stroke-destructive/45"
              />
            )),
          )}
          {apps.map((app, i) => (
            <Caixa key={app} x={40} y={yApp(i)} w={120} h={40} titulo={app} tamanho={16} />
          ))}
          {sistemas.map((sis, i) => (
            <Caixa
              key={sis}
              x={300}
              y={ySis(i)}
              w={130}
              h={40}
              titulo={sis}
              tamanho={16}
              cor="suave"
            />
          ))}
          <Texto x={235} y={352} tamanho={20} classe="fill-destructive font-semibold">
            Sem padrão: 20 integrações
          </Texto>

          <line
            x1={485}
            y1={20}
            x2={485}
            y2={330}
            strokeDasharray="5 8"
            className="stroke-muted-foreground/30"
          />

          {apps.map((app, i) => (
            <line
              key={app}
              x1={660}
              y1={yApp(i) + 20}
              x2={704}
              y2={172}
              strokeWidth={2.5}
              className="stroke-primary"
            />
          ))}
          {sistemas.map((sis, i) => (
            <line
              key={sis}
              x1={796}
              y1={172}
              x2={840}
              y2={ySis(i) + 20}
              strokeWidth={2.5}
              className="stroke-primary"
            />
          ))}
          {apps.map((app, i) => (
            <Caixa key={app} x={540} y={yApp(i)} w={120} h={40} titulo={app} tamanho={16} />
          ))}
          <circle
            cx={750}
            cy={172}
            r={46}
            strokeWidth={3}
            className="fill-primary stroke-primary"
          />
          <Texto
            x={750}
            y={180}
            tamanho={24}
            classe="fill-primary-foreground font-display font-bold"
          >
            MCP
          </Texto>
          {sistemas.map((sis, i) => (
            <Caixa
              key={sis}
              x={840}
              y={ySis(i)}
              w={130}
              h={40}
              titulo={sis}
              tamanho={16}
              cor="suave"
            />
          ))}
          <Texto x={755} y={352} tamanho={20} classe="fill-primary font-semibold">
            Com MCP: 4 + 5 = 9 conexões
          </Texto>
        </>
      )}
    </Svg>
  );
}

function ArquiteturaMcp() {
  return (
    <Svg
      altura={250}
      titulo="O host tem um cliente MCP que conversa com o servidor MCP, que acessa o sistema"
    >
      {(seta) => (
        <>
          <rect
            x={20}
            y={20}
            width={300}
            height={210}
            rx={18}
            strokeWidth={2}
            className={CAIXA.suave}
          />
          <Texto x={170} y={58} tamanho={22} classe="fill-foreground font-display font-bold">
            HOST
          </Texto>
          <Texto x={170} y={84} tamanho={16}>
            Langflow · Claude · Cursor
          </Texto>
          <Caixa x={50} y={115} w={240} h={80} titulo="Cliente MCP" cor="primaria" />
          <Seta d="M290 155 L406 155" seta={seta} cor="primaria" fluir />
          <Texto x={348} y={140} tamanho={15}>
            protocolo
          </Texto>
          <Caixa
            x={410}
            y={40}
            w={250}
            h={170}
            titulo="Servidor MCP"
            linhas={["tools", "resources", "prompts"]}
            cor="agente"
          />
          <Seta d="M660 125 L736 125" seta={seta} />
          <Caixa
            x={740}
            y={65}
            w={240}
            h={120}
            titulo="Sistema"
            linhas={["API · banco", "arquivos"]}
          />
        </>
      )}
    </Svg>
  );
}

function SequenciaMcp() {
  const x = { m: 150, l: 500, s: 850 } as const;
  type Ator = keyof typeof x;
  const mensagens: {
    de: Ator;
    para: Ator;
    y: number;
    texto: string;
    cor?: Cor;
    volta?: boolean;
  }[] = [
    { de: "l", para: "s", y: 105, texto: "1 · initialize (Authorization: Bearer …)" },
    { de: "l", para: "s", y: 155, texto: "2 · tools/list" },
    { de: "s", para: "l", y: 195, texto: "nomes + descrições", volta: true },
    { de: "l", para: "m", y: 245, texto: "3 · descrições entram no contexto", cor: "primaria" },
    { de: "m", para: "l", y: 295, texto: "4 · quero ler_comentarios(post_id=42)", cor: "primaria" },
    { de: "l", para: "s", y: 345, texto: "5 · tools/call" },
    { de: "s", para: "l", y: 385, texto: "resultado", volta: true },
    { de: "l", para: "m", y: 425, texto: "6 · o resultado volta ao modelo", cor: "primaria" },
  ];
  return (
    <Svg altura={445} titulo="Sequência de uma chamada MCP entre o modelo, o Langflow e o servidor">
      {(seta) => (
        <>
          {(["m", "l", "s"] as const).map((ator) => (
            <line
              key={ator}
              x1={x[ator]}
              y1={62}
              x2={x[ator]}
              y2={438}
              strokeDasharray="4 6"
              className="stroke-muted-foreground/30"
            />
          ))}
          <Caixa x={x.m - 110} y={10} w={220} h={52} titulo="Modelo" cor="primaria" />
          <Caixa x={x.l - 110} y={10} w={220} h={52} titulo="Langflow (cliente)" />
          <Caixa x={x.s - 110} y={10} w={220} h={52} titulo="Servidor MCP" cor="agente" />
          {mensagens.map((msg, i) => {
            const x1 = x[msg.de];
            const x2 = x[msg.para];
            const direita = x2 > x1;
            return (
              <g key={i} className="motion-safe:aula-surgir" style={entrada(i * 0.2)}>
                <Seta
                  d={`M${x1 + (direita ? 6 : -6)} ${msg.y} L${x2 + (direita ? -8 : 8)} ${msg.y}`}
                  seta={seta}
                  cor={msg.cor ?? (msg.volta ? "suave" : "padrao")}
                  tracejada={msg.volta ?? false}
                />
                <Texto
                  x={(x1 + x2) / 2}
                  y={msg.y - 10}
                  tamanho={15.5}
                  classe={msg.cor === "primaria" ? "fill-primary" : "fill-foreground"}
                >
                  {msg.texto}
                </Texto>
              </g>
            );
          })}
        </>
      )}
    </Svg>
  );
}

function LinhaTempoMcp() {
  const marcos = [
    { data: "Nov 2024", linhas: ["Anthropic lança o MCP", "como padrão aberto"] },
    { data: "2025", linhas: ["Google, Microsoft, AWS", "e OpenAI passam a apoiar"] },
    { data: "9 dez 2025", linhas: ["Doado à Agentic AI Foundation", "(Linux Foundation)"] },
  ];
  return (
    <Svg altura={200} titulo="Linha do tempo do MCP de 2024 a 2025">
      {(seta) => (
        <>
          <Seta d="M60 90 L950 90" seta={seta} cor="suave" />
          {marcos.map((marco, i) => {
            const cx = 170 + i * 330;
            return (
              <g key={marco.data} className="motion-safe:aula-surgir" style={entrada(i * 0.3)}>
                <circle cx={cx} cy={90} r={13} className="fill-primary" />
                <Texto x={cx} y={60} tamanho={24} classe="fill-primary font-display font-bold">
                  {marco.data}
                </Texto>
                {marco.linhas.map((linha, j) => (
                  <Texto
                    key={linha}
                    x={cx}
                    y={134 + j * 24}
                    tamanho={17}
                    classe={j === 0 ? "fill-foreground" : "fill-muted-foreground"}
                  >
                    {linha}
                  </Texto>
                ))}
              </g>
            );
          })}
        </>
      )}
    </Svg>
  );
}

function RagIngestao() {
  return (
    <Svg
      altura={250}
      titulo="Ingestão do RAG: o documento é partido em pedaços, cada pedaço vira um embedding e vai para o banco vetorial"
    >
      {(seta) => (
        <>
          <g className="motion-safe:aula-surgir">
            <path d="M40 40 h90 l30 30 v130 h-120 z" strokeWidth={2} className={CAIXA.padrao} />
            <path
              d="M130 40 v30 h30"
              fill="none"
              strokeWidth={2}
              className="stroke-muted-foreground/40"
            />
            {[95, 120, 145, 170].map((y) => (
              <line
                key={y}
                x1={60}
                y1={y}
                x2={140}
                y2={y}
                strokeWidth={4}
                strokeLinecap="round"
                className="stroke-muted-foreground/30"
              />
            ))}
            <Texto x={100} y={232} tamanho={18} classe="fill-foreground">
              PDF / site
            </Texto>
          </g>
          <Seta d="M172 120 L226 120" seta={seta} />
          <g className="motion-safe:aula-surgir" style={entrada(0.3)}>
            {[1, 2, 3].map((n, i) => (
              <Caixa
                key={n}
                x={235}
                y={56 + i * 44}
                w={150}
                h={36}
                titulo={`pedaço ${n}`}
                tamanho={16}
                cor="suave"
              />
            ))}
            <Texto x={310} y={232} tamanho={18} classe="fill-foreground">
              pedaços (chunks)
            </Texto>
          </g>
          <Seta d="M392 120 L446 120" seta={seta} />
          <g className="motion-safe:aula-surgir" style={entrada(0.6)}>
            {["[0.12, -0.80, 0.33 …]", "[0.91, 0.04, -0.27 …]", "[-0.15, 0.62, 0.48 …]"].map(
              (vetor, i) => (
                <Texto
                  key={vetor}
                  x={460}
                  y={80 + i * 44}
                  tamanho={17}
                  ancora="start"
                  classe="fill-primary font-mono"
                >
                  {vetor}
                </Texto>
              ),
            )}
            <Texto x={570} y={232} tamanho={18} classe="fill-foreground">
              embeddings
            </Texto>
          </g>
          <Seta d="M690 120 L744 120" seta={seta} />
          <g className="motion-safe:aula-surgir" style={entrada(0.9)}>
            <Cilindro x={755} y={45} w={180} h={150} />
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={810 + i * 35}
                cy={120 + (i % 2) * 22}
                r={8}
                className="fill-primary"
              />
            ))}
            <Texto x={845} y={232} tamanho={18} classe="fill-foreground">
              banco vetorial
            </Texto>
          </g>
        </>
      )}
    </Svg>
  );
}

function RagConsulta() {
  return (
    <Svg
      altura={240}
      titulo="Consulta do RAG: a pergunta vira embedding, busca os trechos mais parecidos e o modelo responde com eles"
    >
      {(seta) => (
        <>
          <Caixa
            x={10}
            y={80}
            w={150}
            h={80}
            titulo="Pergunta"
            linhas={['"que horas abrem?"']}
            tamanho={19}
          />
          <Seta d="M160 120 L193 120" seta={seta} />
          <Caixa
            x={196}
            y={80}
            w={140}
            h={80}
            titulo="Embedding"
            linhas={["[0.11, …]"]}
            tamanho={19}
            mono
          />
          <Seta d="M336 120 L369 120" seta={seta} />
          <Caixa
            x={372}
            y={60}
            w={170}
            h={120}
            titulo="Busca top-k"
            linhas={["os 3 trechos", "mais parecidos"]}
            cor="agente"
            tamanho={19}
          />
          <Seta d="M542 120 L575 120" seta={seta} />
          <Caixa
            x={578}
            y={40}
            w={220}
            h={160}
            titulo="Prompt"
            linhas={["instrução", "+ trechos", "+ pergunta"]}
            cor="primaria"
          />
          <Seta d="M798 120 L831 120" seta={seta} cor="primaria" />
          <Caixa
            x={834}
            y={80}
            w={156}
            h={80}
            titulo="Resposta"
            linhas={["com a fonte"]}
            tamanho={19}
            cor="primaria"
          />
        </>
      )}
    </Svg>
  );
}

function PainelRag({
  x,
  y,
  titulo,
  etiqueta,
  children,
}: {
  x: number;
  y: number;
  titulo: string;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <g>
      <rect x={x} y={y} width={480} height={215} rx={16} strokeWidth={2} className={CAIXA.suave} />
      <Texto
        x={x + 20}
        y={y + 38}
        tamanho={22}
        ancora="start"
        classe="fill-foreground font-display font-bold"
      >
        {titulo}
      </Texto>
      <Texto x={x + 460} y={y + 36} tamanho={14} ancora="end" classe="fill-primary">
        {etiqueta}
      </Texto>
      {children}
    </g>
  );
}

function RagTipos() {
  return (
    <Svg
      altura={470}
      titulo="Quatro tipos de RAG: simples, híbrido com reranking, agêntico e GraphRAG"
    >
      {(seta) => (
        <>
          <PainelRag x={10} y={10} titulo="Simples" etiqueta="comece aqui">
            <Caixa x={30} y={95} w={60} h={50} titulo="P" tamanho={18} />
            <Seta d="M90 120 L128 120" seta={seta} />
            <Caixa
              x={130}
              y={95}
              w={160}
              h={50}
              titulo="Busca vetorial"
              tamanho={17}
              cor="agente"
            />
            <Seta d="M290 120 L338 120" seta={seta} />
            <Texto x={314} y={108} tamanho={13}>
              top-k
            </Texto>
            <Caixa x={340} y={95} w={90} h={50} titulo="LLM" tamanho={18} cor="primaria" />
            <Texto x={250} y={195} tamanho={15}>
              rápido e bom para começar
            </Texto>
          </PainelRag>

          <PainelRag x={510} y={10} titulo="Híbrido + rerank" etiqueta="o mais usado">
            <Caixa x={525} y={95} w={50} h={50} titulo="P" tamanho={18} />
            <Seta d="M575 112 L606 92" seta={seta} />
            <Seta d="M575 128 L606 148" seta={seta} />
            <Caixa x={610} y={65} w={140} h={40} titulo="Palavra-chave" tamanho={15} cor="agente" />
            <Caixa x={610} y={135} w={140} h={40} titulo="Vetorial" tamanho={15} cor="agente" />
            <Seta d="M750 85 L783 112" seta={seta} />
            <Seta d="M750 155 L783 128" seta={seta} />
            <Caixa x={786} y={95} w={100} h={50} titulo="Rerank" tamanho={16} />
            <Seta d="M886 120 L911 120" seta={seta} />
            <Caixa x={914} y={95} w={64} h={50} titulo="LLM" tamanho={16} cor="primaria" />
            <Texto x={750} y={205} tamanho={15}>
              acerta nomes, códigos e siglas
            </Texto>
          </PainelRag>

          <PainelRag x={10} y={245} titulo="Agêntico" etiqueta="decide sozinho">
            <Caixa x={30} y={320} w={60} h={50} titulo="P" tamanho={18} />
            <Seta d="M90 345 L128 345" seta={seta} />
            <Caixa
              x={130}
              y={305}
              w={170}
              h={80}
              titulo="Agente"
              linhas={["decide, busca", "e reformula"]}
              tamanho={18}
              cor="agente"
            />
            <Seta d="M205 386 L205 410" seta={seta} />
            <Seta d="M225 410 L225 388" seta={seta} />
            <Caixa x={160} y={412} w={110} h={36} titulo="busca" tamanho={15} cor="suave" />
            <Seta d="M300 345 L338 345" seta={seta} />
            <Caixa x={340} y={320} w={130} h={50} titulo="Resposta" tamanho={17} cor="primaria" />
          </PainelRag>

          <PainelRag x={510} y={245} titulo="GraphRAG" etiqueta="relações">
            <Caixa x={525} y={330} w={50} h={50} titulo="P" tamanho={18} />
            <Seta d="M575 350 L622 328" seta={seta} />
            <g className="stroke-muted-foreground/50" strokeWidth={2}>
              <line x1={640} y1={320} x2={740} y2={300} />
              <line x1={740} y1={300} x2={710} y2={390} />
              <line x1={740} y1={300} x2={810} y2={360} />
              <line x1={710} y1={390} x2={810} y2={360} />
              <line x1={640} y1={320} x2={710} y2={390} />
            </g>
            {(
              [
                [640, 320, "fornecedor"],
                [740, 300, "contrato"],
                [710, 390, "multa"],
                [810, 360, "atraso"],
              ] as const
            ).map(([cx, cy, rotulo]) => (
              <g key={rotulo}>
                <circle cx={cx} cy={cy} r={12} className="fill-agent" />
                <Texto x={cx} y={cy + 30} tamanho={13}>
                  {rotulo}
                </Texto>
              </g>
            ))}
            <Seta d="M824 355 L878 345" seta={seta} />
            <Caixa x={880} y={320} w={90} h={50} titulo="LLM" tamanho={17} cor="primaria" />
          </PainelRag>
        </>
      )}
    </Svg>
  );
}

const DIAGRAMAS: Record<NomeDiagrama, () => ReactNode> = {
  trilha: Trilha,
  "proximo-token": ProximoToken,
  "chatbot-agente": ChatbotAgente,
  "ciclo-agente": CicloAgente,
  "busca-web": BuscaWeb,
  "anatomia-componente": AnatomiaComponente,
  "fluxo-simples": FluxoSimples,
  "fluxo-agente": FluxoAgente,
  nxm: NxM,
  "arquitetura-mcp": ArquiteturaMcp,
  "sequencia-mcp": SequenciaMcp,
  "linha-tempo-mcp": LinhaTempoMcp,
  "fluxo-mcp": FluxoMcp,
  "rag-ingestao": RagIngestao,
  "rag-consulta": RagConsulta,
  "rag-tipos": RagTipos,
};

export function Diagrama({ nome }: { nome: NomeDiagrama }) {
  const Componente = DIAGRAMAS[nome];
  return <Componente />;
}

export const NOMES_DIAGRAMAS = Object.keys(DIAGRAMAS) as NomeDiagrama[];
