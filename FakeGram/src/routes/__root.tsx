import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, OctagonPause } from "lucide-react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getStatus, MODO_DEMO } from "@/lib/api";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-mono text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">Esse endereço não existe no Fakegram.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo deu errado. Tente de novo.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fakegram · Oficina Langflow" },
      { name: "description", content: "Portal da oficina de agentes de IA com Langflow e MCP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NavItem({
  item,
  className,
  onClick,
}: {
  item: (typeof NAV)[number];
  className: string;
  onClick?: () => void;
}) {
  const active = { className: "bg-secondary text-foreground" };
  if ("params" in item) {
    return (
      <Link
        to={item.to}
        params={item.params}
        className={className}
        activeProps={active}
        onClick={onClick}
      >
        {item.label}
      </Link>
    );
  }
  return (
    <Link to={item.to} className={className} activeProps={active} onClick={onClick}>
      {item.label}
    </Link>
  );
}

const NAV = [
  { to: "/feed", label: "Feed" },
  { to: "/aula/estudo", label: "Aula" },
  { to: "/exercicios/$n", params: { n: "1" }, label: "Exercícios" },
  { to: "/ranking", label: "Ranking" },
  { to: "/grupo", label: "Meu grupo" },
  { to: "/status", label: "Status" },
] as const;

function PausaBanner() {
  const q = useQuery({ queryKey: ["status"], queryFn: getStatus, refetchInterval: 10_000 });
  if (!q.data?.agentes_pausados) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
      <OctagonPause className="h-4 w-4" /> Agentes pausados pelo instrutor
    </div>
  );
}

function Shell() {
  const [aberto, setAberto] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  // Telão, apresentação e painel do instrutor ocupam a tela inteira, sem menu.
  const telaCheia =
    path.startsWith("/telao") ||
    path === "/aula" ||
    path === "/aula/" ||
    path.startsWith("/aula/apresentador");
  if (telaCheia) return <Outlet />;
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 print:hidden">
        <PausaBanner />
        <header className="border-b bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
            <Link to="/" className="font-display text-xl font-bold tracking-tight">
              fake<span className="text-primary">gram</span>
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">/lab</span>
            </Link>
            <nav className="ml-auto hidden gap-1 md:flex">
              {NAV.map((n) => (
                <NavItem
                  key={n.label}
                  item={n}
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                />
              ))}
            </nav>
            <button
              className="ml-auto md:hidden"
              onClick={() => setAberto(!aberto)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          {aberto && (
            <nav className="flex flex-col border-t px-4 py-2 md:hidden">
              {NAV.map((n) => (
                <NavItem
                  key={n.label}
                  item={n}
                  className="py-2 text-sm"
                  onClick={() => setAberto(false)}
                />
              ))}
            </nav>
          )}
        </header>
      </div>
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-xs text-muted-foreground print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4">
          <span>
            Fakegram · Oficina Langflow — rede fictícia para fins didáticos
            {MODO_DEMO && " · modo demonstração (dados falsos)"}
          </span>
          <Link to="/admin" className="opacity-50 hover:opacity-100">
            instrutor
          </Link>
        </div>
      </footer>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
      <Toaster theme="dark" position="bottom-right" richColors />
    </QueryClientProvider>
  );
}
