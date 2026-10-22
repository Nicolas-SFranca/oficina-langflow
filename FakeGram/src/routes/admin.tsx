import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BotaoCopiar, Carregando, Erro, PageTitle, SkeletonLinhas, Vazio } from "@/components/fg";
import { Switch } from "@/components/ui/switch";
import {
  adminCriarGrupo,
  adminEstudo,
  adminGrupos,
  adminPausar,
  adminReset,
  adminRevogar,
  adminSimular,
  getAdminKey,
  getEstudo,
  getPerfis,
  getStatus,
  MODO_DEMO,
  setAdminKey,
} from "@/lib/api";
import { mascarar } from "@/lib/util";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Instrutor · Fakegram" },
      { name: "description", content: "Área do instrutor da oficina." },
      { property: "og:title", content: "Instrutor · Fakegram" },
      { property: "og:description", content: "Controle da oficina." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [key, setK] = useState<string | null | undefined>(undefined);
  const [v, setV] = useState("");
  const [load, setLoad] = useState(false);
  useEffect(() => setK(getAdminKey()), []);
  if (key === undefined) return <Carregando />;
  if (!key) {
    return (
      <form
        className="mx-auto max-w-sm space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoad(true);
          setAdminKey(v);
          try {
            await adminGrupos();
            setK(v);
          } catch (err) {
            setAdminKey(null);
            toast.error((err as Error).message);
          }
          setLoad(false);
        }}
      >
        <PageTitle
          titulo="Instrutor"
          sub={MODO_DEMO ? "Demonstração: chave oficina" : "Digite a chave de admin."}
        />
        <label className="block space-y-1">
          <span className="text-sm text-muted-foreground">Chave de admin</span>
          <input
            type="password"
            value={v}
            onChange={(e) => setV(e.target.value)}
            autoComplete="off"
            className="w-full rounded-md border bg-background px-3 py-2 font-mono"
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
  return (
    <Painel
      sair={() => {
        setAdminKey(null);
        setK(null);
      }}
    />
  );
}

function Painel({ sair }: { sair: () => void }) {
  const qc = useQueryClient();
  const grupos = useQuery({ queryKey: ["admin-grupos"], queryFn: adminGrupos });
  const status = useQuery({ queryKey: ["status"], queryFn: getStatus });
  const perfis = useQuery({ queryKey: ["perfis"], queryFn: getPerfis });
  const estudo = useQuery({ queryKey: ["estudo"], queryFn: getEstudo });
  const [visiveis, setVisiveis] = useState<Record<number, boolean>>({});
  const [nome, setNome] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [criando, setCriando] = useState(false);
  const [resetAberto, setResetAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const pausado = !!status.data?.agentes_pausados;
  const livres = perfis.data?.filter((p) => p.grupo_id == null) ?? [];

  const atualizar = async () => {
    await Promise.all([grupos.refetch(), status.refetch(), perfis.refetch(), estudo.refetch()]);
    qc.invalidateQueries({ queryKey: ["ranking"] });
    qc.invalidateQueries({ queryKey: ["feed"] });
    qc.invalidateQueries({ queryKey: ["atividade"] });
  };

  const run = async (f: () => Promise<unknown>, ok: string) => {
    try {
      await f();
      toast.success(ok);
      await atualizar();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle titulo="Instrutor" sub="Controle da oficina." />
        <button type="button" onClick={sair} className="mb-6 rounded-md border px-3 py-1.5 text-sm">
          Sair
        </button>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 sm:p-6",
          pausado ? "border-destructive bg-destructive/15" : "bg-card",
        )}
      >
        <div>
          <p className="text-xl font-bold">{pausado ? "Agentes pausados" : "Agentes ativos"}</p>
          <p className="text-sm text-muted-foreground">Pausar todos os agentes</p>
        </div>
        <Switch
          checked={pausado}
          disabled={status.isPending}
          aria-label="Pausar todos os agentes"
          onCheckedChange={(v) =>
            run(() => adminPausar(v), v ? "Agentes pausados" : "Agentes retomados")
          }
          className="h-10 w-20 data-[state=checked]:bg-destructive [&>span]:h-8 [&>span]:w-8 [&>span]:data-[state=checked]:translate-x-10"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 sm:p-6">
        <div>
          <p className="text-xl font-bold">
            {estudo.data?.liberado ? "Kit de estudo liberado" : "Kit de estudo fechado"}
          </p>
          <p className="text-sm text-muted-foreground">
            Sem token e com os gabaritos. Libere só depois da aula: ele aparece em /aula/estudo.
          </p>
        </div>
        <Switch
          checked={!!estudo.data?.liberado}
          disabled={estudo.isPending}
          aria-label="Liberar o kit de estudo"
          onCheckedChange={(v) =>
            run(() => adminEstudo(v), v ? "Kit de estudo liberado" : "Kit de estudo fechado")
          }
          className="h-10 w-20 [&>span]:h-8 [&>span]:w-8 [&>span]:data-[state=checked]:translate-x-10"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Grupos</h2>
        {grupos.isPending ? (
          <SkeletonLinhas n={6} />
        ) : grupos.isError ? (
          <Erro erro={grupos.error} onRetry={() => grupos.refetch()} />
        ) : !grupos.data?.length ? (
          <Vazio texto="Nenhum grupo cadastrado" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  {["Nome", "Perfil", "Token", "Pontos", "Ativo", ""].map((h) => (
                    <th key={h || "acoes"} className="px-3 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grupos.data.map((g) => (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="px-3 py-3 font-medium">{g.nome}</td>
                    <td className="px-3 py-3">@{g.perfil.handle}</td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs">
                        {visiveis[g.id] ? g.token : mascarar(g.token)}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setVisiveis((s) => ({ ...s, [g.id]: !s[g.id] }))}
                          className="rounded-md border px-2 py-1 text-xs"
                        >
                          {visiveis[g.id] ? "ocultar" : "mostrar"}
                        </button>
                        <BotaoCopiar texto={g.token} />
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono">{g.pontos}</td>
                    <td className="px-3 py-3">{g.ativo ? "ativo" : "revogado"}</td>
                    <td className="px-3 py-3">
                      {g.ativo && (
                        <button
                          type="button"
                          onClick={() => run(() => adminRevogar(g.id), "Token revogado")}
                          className="text-destructive"
                        >
                          Revogar token
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 text-xl font-semibold">Novo grupo</h2>
        {perfis.isPending ? (
          <SkeletonLinhas n={2} />
        ) : perfis.isError ? (
          <Erro erro={perfis.error} onRetry={() => perfis.refetch()} />
        ) : (
          <form
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!nome.trim() || !perfilId) return;
              setCriando(true);
              try {
                await adminCriarGrupo(nome.trim(), Number(perfilId));
                toast.success("Grupo criado");
                setNome("");
                setPerfilId("");
                await atualizar();
              } catch (err) {
                toast.error((err as Error).message);
              }
              setCriando(false);
            }}
          >
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Nome</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Grupo 7"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Perfil sem grupo</span>
              <select
                value={perfilId}
                onChange={(e) => setPerfilId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={!livres.length}
              >
                <option value="">
                  {livres.length ? "Escolha um perfil" : "Todos os perfis já têm grupo"}
                </option>
                {livres.map((p) => (
                  <option key={p.id} value={p.id}>
                    @{p.handle} — {p.nome}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={criando || !nome.trim() || !perfilId}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {criando ? "Criando…" : "Criar grupo"}
            </button>
          </form>
        )}
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => run(() => adminSimular(20), "Atividade simulada")}
          className="rounded-xl border bg-card px-4 py-3 text-sm font-medium"
        >
          Simular atividade (20)
        </button>
        <button
          type="button"
          onClick={() => {
            setResetAberto(true);
            setConfirmacao("");
          }}
          className="rounded-xl border border-destructive px-4 py-3 text-sm font-medium text-destructive"
        >
          Resetar dados
        </button>
        <Link
          to="/telao"
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium"
        >
          <Monitor className="h-4 w-4" /> Abrir telão
        </Link>
      </section>

      {resetAberto && (
        <form
          className="space-y-3 rounded-2xl border border-destructive/50 bg-destructive/10 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (confirmacao !== "RESET") return;
            setResetAberto(false);
            setConfirmacao("");
            run(adminReset, "Dados resetados");
          }}
        >
          <p className="font-medium">
            Digite RESET para confirmar. Isso recria os dados da oficina.
          </p>
          <input
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            placeholder="RESET"
            className="w-full max-w-xs rounded-md border bg-background px-3 py-2 font-mono"
          />
          <div className="flex gap-2">
            <button
              disabled={confirmacao !== "RESET"}
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
            >
              Confirmar reset
            </button>
            <button
              type="button"
              onClick={() => setResetAberto(false)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
