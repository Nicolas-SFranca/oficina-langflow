import { useEffect, useState } from "react";

export function tempoRelativo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export const mascarar = (t: string) => `••••${t.slice(-4)}`;

/** Intervalo de atualização que pausa quando a aba está oculta. */
export function useVisibleInterval(ms: number): number | false {
  const [visivel, setVisivel] = useState(true);
  useEffect(() => {
    const f = () => setVisivel(document.visibilityState === "visible");
    f();
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);
  return visivel ? ms : false;
}

/** Estado booleano persistido no localStorage (lido após hidratação). */
export function useChecks(chave: string) {
  const [v, setV] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      setV(JSON.parse(localStorage.getItem(chave) ?? "{}"));
    } catch {
      /* ignore */
    }
  }, [chave]);
  const toggle = (id: string) =>
    setV((old) => {
      const n = { ...old, [id]: !old[id] };
      localStorage.setItem(chave, JSON.stringify(n));
      return n;
    });
  return [v, toggle] as const;
}

export async function copiar(texto: string) {
  await navigator.clipboard.writeText(texto);
}
