import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileCode2, Workflow } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Avatar,
  CampoCopiar,
  Carregando,
  CodeBlock,
  Erro,
  PageTitle,
  SkeletonLinhas,
  Vazio,
} from "@/components/fg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL } from "@/config";
import { baixarKit, getToken, grupoLog, grupoMe, MODO_DEMO, setToken } from "@/lib/api";
import { hora, mascarar, useVisibleInterval } from "@/lib/util";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/grupo")({
  head: () => ({
    meta: [
      { title: "Meu grupo · Fakegram" },
      { name: "description", content: "Painel do grupo: log do agente, conexão MCP e kit." },
      { property: "og:title", content: "Meu grupo · Fakegram" },
      { property: "og:description", content: "Painel do grupo na oficina." },
    ],
  }),
  component: GrupoPage,
});

const BASE = (API_URL || "https://api.fakegram.exemplo.com").replace(/\/$/, "");

const KIT = [
  "Guias dos exercícios 1, 2 e 3 (LEIAME de cada pasta)",
  ".env pré-configurado com a URL e o token do grupo",
  "Servidor MCP local do exercício 3, em três níveis",
  "Bônus: agente analista e o manual da marca para RAG",
];

const PASSOS_MCP = [
  "No Langflow, abra Servidores MCP na barra da esquerda.",
  "Clique em Incluir servidor MCP.",
  "Escolha a opção de servidor HTTP.",
  "Cole a URL e o header abaixo e salve.",
  "No fluxo, use o componente MCP Tools com este servidor, em Tool Mode.",
];

function snippets(token: string) {
  const auth = `Bearer ${token}`;
  const curl = [
    `curl -s "${BASE}/api/grupo/posts" \\`,
    `  -H "Authorization: ${auth}"`,
    "",
    `curl -s -X POST "${BASE}/api/grupo/comentarios/123/responder" \\`,
    `  -H "Authorization: ${auth}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"texto":"Obrigado pelo comentário!"}'`,
  ].join("\n");
  const python = [
    "import requests",
    "",
    `BASE = "${BASE}"`,
    `TOKEN = "${token}"`,
    'headers = {"Authorization": f"Bearer {TOKEN}"}',
    "",
    'posts = requests.get(f"{BASE}/api/grupo/posts", headers=headers)',
    "print(posts.json())",
    "",
    "resposta = requests.post(",
    '    f"{BASE}/api/grupo/comentarios/123/responder",',
    "    headers=headers,",
    '    json={"texto": "Obrigado pelo comentário!"},',
    ")",
    "print(resposta.json())",
  ].join("\n");
  const javascript = [
    `const BASE = "${BASE}";`,
    `const TOKEN = "${token}";`,
    "const headers = { Authorization: `Bearer ${TOKEN}` };",
    "",
    "const posts = await fetch(`${BASE}/api/grupo/posts`, { headers });",
    "console.log(await posts.json());",
    "",
    "const resposta = await fetch(`${BASE}/api/grupo/comentarios/123/responder`, {",
    '  method: "POST",',
    '  headers: { ...headers, "Content-Type": "application/json" },',
    '  body: JSON.stringify({ texto: "Obrigado pelo comentário!" }),',
    "});",
    "console.log(await resposta.json());",
  ].join("\n");
  return { curl, python, javascript };
}

function jsonBonito(v: unknown) {
  if (typeof v === "string") {
    try {
      return JSON.stringify(JSON.parse(v), null, 2);
    } catch {
      return v;
    }
  }
  return JSON.stringify(v, null, 2);
}

function GrupoPage() {
  const [token, setT] = useState<string | null | undefined>(undefined);
  useEffect(() => setT(getToken()), []);
  if (token === undefined) return <Carregando />;
  if (!token) return <Entrar onOk={setT} />;
  return (
    <Painel
      token={token}
      sair={() => {
        setToken(null);
        setT(null);
      }}
    />
  );
}

function Entrar({ onOk }: { onOk: (t: string) => void }) {
  const [v, setV] = useState("");
  const [load, setLoad] = useState(false);
  return (
    <form
      className="mx-auto max-w-sm space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoad(true);
        setToken(v.trim());
        try {
          await grupoMe();
          onOk(v.trim());
        } catch (err) {
          setToken(null);
          toast.error((err as Error).message);
        }
        setLoad(false);
      }}
    >
      <PageTitle
        titulo="Meu grupo"
        sub={
          MODO_DEMO
            ? "Demonstração: use fg_demo_grupo1_5ccd"
            : "Digite o token recebido do instrutor."
        }
      />
      <label className="block space-y-1">
        <span className="text-sm text-muted-foreground">Token do grupo</span>
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="fg_…"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
        />
      </label>
      <button
        disabled={load || !v.trim()}
        className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground disabled:opacity-60"
      >
        {load ? "Validando…" : "Entrar"}
      </button>
    </form>
  );
}

function Painel({ token, sair }: { token: string; sair: () => void }) {
  const intervalo = useVisibleInterval(5000);
  const me = useQuery({ queryKey: ["me", token], queryFn: grupoMe });
  const log = useQuery({
    queryKey: ["log", token],
    queryFn: () => grupoLog(50),
    refetchInterval: intervalo,
  });
  const [ver, setVer] = useState(false);
  const [aberto, setAberto] = useState<number | null>(null);
  const [baixando, setBaixando] = useState(false);

  if (me.isPending) return <SkeletonCardsGrupo />;
  if (me.isError) {
    return (
      <div className="space-y-4">
        <Erro erro={me.error} onRetry={() => me.refetch()} />
        <button onClick={sair} className="rounded-md border px-4 py-2 text-sm">
          Sair e tentar outro token
        </button>
      </div>
    );
  }
  const g = me.data;
  const codigos = snippets(token);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Avatar src={g.perfil.avatar_url} alt={g.perfil.nome} size={64} />
        <div className="min-w-[10rem] flex-1 basis-40">
          <p className="text-sm text-muted-foreground">{g.nome}</p>
          <h1 className="text-xl font-bold sm:text-2xl">@{g.perfil.handle}</h1>
          <p className="break-all font-mono text-xs text-muted-foreground">
            token {ver ? token : mascarar(token)}{" "}
            <button type="button" onClick={() => setVer(!ver)} className="underline">
              {ver ? "ocultar" : "mostrar"}
            </button>
          </p>
        </div>
        <p className="font-mono text-3xl font-bold text-primary sm:text-4xl">
          {g.pontos}
          <span className="ml-1 text-base font-medium text-muted-foreground">pts</span>
        </p>
        <button type="button" onClick={sair} className="rounded-md border px-3 py-1.5 text-sm">
          Sair
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Curtidas recebidas", g.metricas.curtidas_recebidas],
          ["Sem resposta", g.metricas.comentarios_sem_resposta],
          ["Posts hoje", g.metricas.posts_hoje],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <p className="font-mono text-3xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="log">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="log">Log do agente</TabsTrigger>
          <TabsTrigger value="mcp">Conectar no Langflow</TabsTrigger>
          <TabsTrigger value="kit">Kit</TabsTrigger>
          <TabsTrigger value="codigo">Código</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Log do agente</h2>
            <span className="font-mono text-xs text-muted-foreground">atualiza a cada 5 s</span>
          </div>
          {log.isPending ? (
            <SkeletonLinhas />
          ) : log.isError ? (
            <Erro erro={log.error} onRetry={() => log.refetch()} />
          ) : !log.data?.length ? (
            <Vazio texto="Nenhuma ação do agente ainda" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    {["Horário", "Ferramenta", "Resumo", "Sucesso"].map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {log.data.map((a) => (
                    <Fragment key={a.id}>
                      <tr
                        onClick={() => setAberto(aberto === a.id ? null : a.id)}
                        className="cursor-pointer border-b hover:bg-accent/50"
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                          {hora(a.criado_em)}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{a.ferramenta}</td>
                        <td className="px-3 py-2">{a.resumo}</td>
                        <td
                          className={cn(
                            "px-3 py-2 font-mono text-lg",
                            a.sucesso ? "text-success" : "text-destructive",
                          )}
                        >
                          {a.sucesso ? "✓" : "✗"}
                        </td>
                      </tr>
                      {aberto === a.id && (
                        <tr className="border-b bg-background/60">
                          <td colSpan={4} className="px-3 py-3">
                            <p className="mb-1 font-mono text-[11px] uppercase text-muted-foreground">
                              parâmetros
                            </p>
                            <pre className="overflow-x-auto rounded-lg border bg-background p-3 font-mono text-xs">
                              {jsonBonito(a.parametros)}
                            </pre>
                            <p className="mb-1 mt-3 font-mono text-[11px] uppercase text-muted-foreground">
                              resultado
                            </p>
                            <pre className="overflow-x-auto rounded-lg border bg-background p-3 font-mono text-xs">
                              {jsonBonito(a.resultado)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mcp" className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Conectar no Langflow</h2>
          <ol className="space-y-2">
            {PASSOS_MCP.map((p, i) => (
              <li key={p} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5">{p}</span>
              </li>
            ))}
          </ol>
          <CampoCopiar rotulo="URL do MCP" valor={g.mcp_url} />
          <CampoCopiar rotulo="Nome do header" valor="Authorization" />
          <CampoCopiar rotulo="Valor" valor={`Bearer ${token}`} />
        </TabsContent>

        <TabsContent value="kit" className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Kit do grupo</h2>
          <button
            type="button"
            disabled={baixando}
            onClick={async () => {
              setBaixando(true);
              try {
                await baixarKit();
              } catch (e) {
                toast.error((e as Error).message);
              }
              setBaixando(false);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-5 text-lg font-bold text-primary-foreground disabled:opacity-60"
          >
            <Download className="h-5 w-5" /> {baixando ? "Baixando…" : "Baixar meu kit (.zip)"}
          </button>
          <ul className="space-y-2 text-sm">
            {KIT.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-lg border bg-background px-3 py-2"
              >
                {item.startsWith("Fluxos") ? (
                  <Workflow className="mt-0.5 h-4 w-4 text-primary" />
                ) : (
                  <FileCode2 className="mt-0.5 h-4 w-4 text-primary" />
                )}
                {item}
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="codigo" className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Código</h2>
          <p className="text-sm text-muted-foreground">
            Exemplos já preenchidos com a URL e o token deste grupo. Chamam{" "}
            <span className="font-mono text-xs">GET /api/grupo/posts</span> e{" "}
            <span className="font-mono text-xs">
              POST /api/grupo/comentarios/{"{id}"}/responder
            </span>
            .{MODO_DEMO && " A URL abaixo é de exemplo até o backend estar no ar."}
          </p>
          <Tabs defaultValue="curl">
            <TabsList>
              <TabsTrigger value="curl">curl</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>
            <TabsContent value="curl">
              <CodeBlock codigo={codigos.curl} />
            </TabsContent>
            <TabsContent value="python">
              <CodeBlock codigo={codigos.python} />
            </TabsContent>
            <TabsContent value="javascript">
              <CodeBlock codigo={codigos.javascript} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SkeletonCardsGrupo() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <SkeletonLinhas n={6} />
    </div>
  );
}
