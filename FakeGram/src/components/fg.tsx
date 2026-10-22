import { Link } from "@tanstack/react-router";
import { AlertTriangle, Check, Copy, Heart, Inbox, Loader2, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Atividade, Comentario, Post } from "@/lib/types";
import { copiar, tempoRelativo } from "@/lib/util";
import { cn } from "@/lib/utils";

export function AgentBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-agent px-2 py-0.5 text-[11px] font-medium text-agent-foreground",
        className,
      )}
    >
      🤖 agente
    </span>
  );
}

export function SkeletonLinhas({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export function SkeletonCards({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {texto}
    </div>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-muted-foreground">
      <Inbox className="h-6 w-6" /> {texto}
    </div>
  );
}

export function Erro({ erro, onRetry }: { erro: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 py-10 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <p className="text-sm">{erro instanceof Error ? erro.message : "Algo deu errado"}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function BotaoCopiar({ texto, className }: { texto: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await copiar(texto);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {
          toast.error("Não foi possível copiar");
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border bg-secondary px-2 py-1 text-xs hover:bg-accent",
        className,
      )}
    >
      {ok ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}{" "}
      {ok ? "Copiado" : "Copiar"}
    </button>
  );
}

export function CodeBlock({ codigo }: { codigo: string }) {
  return (
    <div className="relative">
      <pre className="max-w-full overflow-x-auto rounded-lg border bg-background p-4 pr-24 font-mono text-xs leading-relaxed">
        {codigo}
      </pre>
      <BotaoCopiar texto={codigo} className="absolute right-2 top-2" />
    </div>
  );
}

export function CampoCopiar({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted-foreground">{rotulo}</span>
      <div className="flex gap-2">
        <input
          readOnly
          value={valor}
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 font-mono text-xs"
        />
        <BotaoCopiar texto={valor} />
      </div>
    </label>
  );
}

export function Avatar({ src, alt, size = 36 }: { src: string; alt: string; size?: number }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-full border object-cover"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}

export function PostCard({
  post,
  onOpen,
  nova,
}: {
  post: Post;
  onOpen?: (id: number) => void;
  nova?: boolean;
}) {
  const [curtido, setCurtido] = useState(false);
  return (
    <article className={cn("overflow-hidden rounded-2xl border bg-card", nova && "animate-enter")}>
      <header className="flex items-center gap-3 p-3">
        <Avatar src={post.perfil.avatar_url} alt={post.perfil.nome} />
        <div className="min-w-0 flex-1">
          <Link
            to="/perfil/$handle"
            params={{ handle: post.perfil.handle }}
            className="block truncate text-sm font-semibold hover:text-primary"
          >
            @{post.perfil.handle}
          </Link>
          <p className="text-xs text-muted-foreground">{tempoRelativo(post.criado_em)}</p>
        </div>
        {post.origem === "agente" && <AgentBadge />}
      </header>
      <button type="button" onClick={() => onOpen?.(post.id)} className="block w-full">
        <img
          src={post.imagem_url}
          alt={post.legenda}
          className="aspect-square w-full bg-muted object-cover"
          loading="lazy"
        />
      </button>
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setCurtido(!curtido)}
            className="flex items-center gap-1.5"
            aria-label="Curtir"
          >
            <Heart
              className={cn("h-5 w-5 transition", curtido ? "fill-primary text-primary" : "")}
            />{" "}
            {post.curtidas + (curtido ? 1 : 0)}
          </button>
          <button
            type="button"
            onClick={() => onOpen?.(post.id)}
            className="flex items-center gap-1.5"
          >
            <MessageCircle className="h-5 w-5" /> {post.total_comentarios}
          </button>
        </div>
        <p className="text-sm">
          <span className="font-semibold">@{post.perfil.handle}</span> {post.legenda}
        </p>
        <p className="text-sm text-primary">{post.hashtags.map((h) => `#${h}`).join(" ")}</p>
      </div>
    </article>
  );
}

export function ComentarioItem({ c, nivel = 0 }: { c: Comentario; nivel?: number }) {
  return (
    <div className={cn(nivel > 0 && "ml-6 border-l pl-4")}>
      <div className="py-2">
        {c.oculto ? (
          <p className="text-sm italic text-muted-foreground">
            [comentário removido pela moderação]
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold">@{c.autor}</span>
              {c.origem === "agente" && <AgentBadge />}
              <span className="text-muted-foreground">{tempoRelativo(c.criado_em)}</span>
            </div>
            <p className="mt-0.5 text-sm">{c.texto}</p>
          </>
        )}
      </div>
      {c.respostas?.map((r) => (
        <ComentarioItem key={r.id} c={r} nivel={nivel + 1} />
      ))}
    </div>
  );
}

export function AtividadeItem({ a, grande }: { a: Atividade; grande?: boolean }) {
  return (
    <li
      className={cn(
        "animate-enter flex min-h-0 gap-3 rounded-lg border-l-2 border-agent bg-agent/10 p-3",
        grande && "p-3",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {grande ? <AgentBadge className="text-sm" /> : <AgentBadge />}
          <span
            className={cn(
              "font-mono text-muted-foreground",
              grande ? "text-[clamp(1rem,1.3vw,1.5rem)]" : "text-[11px]",
            )}
          >
            {a.ferramenta}
          </span>
          {!a.sucesso && (
            <X className={cn("shrink-0 text-destructive", grande ? "h-7 w-7" : "h-3.5 w-3.5")} />
          )}
        </div>
        <p
          className={cn(
            "mt-1",
            grande
              ? "line-clamp-2 text-[clamp(1.5rem,2.5vw,3rem)] font-semibold leading-tight"
              : "text-sm",
          )}
        >
          {a.resumo}
        </p>
        <p
          className={cn(
            "text-muted-foreground",
            grande ? "text-[clamp(1rem,1.2vw,1.35rem)]" : "text-xs",
          )}
        >
          {tempoRelativo(a.criado_em)}
        </p>
      </div>
    </li>
  );
}

export function PageTitle({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold md:text-4xl">{titulo}</h1>
      {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
    </div>
  );
}
