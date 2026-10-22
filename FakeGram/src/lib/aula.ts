import { useCallback, useEffect, useRef, useState } from "react";
import { limitarIndice } from "@/content/aula";

/**
 * Divide um texto em tokens, só para o slide de tokens. Não é o tokenizador de
 * nenhum modelo: imita o comportamento comum de manter palavras curtas inteiras
 * e quebrar palavras longas em pedaços. Juntar os tokens devolve o texto original.
 */
export function tokenizar(texto: string): string[] {
  const pedacos = texto.match(/\s*[\p{L}\p{M}\p{N}]+|\s*[^\s\p{L}\p{M}\p{N}]|\s+/gu) ?? [];
  const tokens: string[] = [];
  for (const pedaco of pedacos) {
    const espaco = /^\s*/.exec(pedaco)?.[0] ?? "";
    let resto = pedaco.slice(espaco.length);
    if (resto.length <= 5) {
      tokens.push(pedaco);
      continue;
    }
    let prefixo = espaco;
    while (resto.length > 0) {
      const tamanho = resto.length <= 5 ? resto.length : 4;
      tokens.push(prefixo + resto.slice(0, tamanho));
      resto = resto.slice(tamanho);
      prefixo = "";
    }
  }
  return tokens;
}

/** O que a apresentação e o painel do instrutor compartilham. */
export type EstadoAula = {
  indice: number;
  /** Mostra as respostas do quiz. */
  revelado: boolean;
  /** Quando o cronômetro da prática acaba, em milissegundos desde 1970. */
  fimCronometro: number | null;
  /** Quando o instrutor começou a aula, para comparar com o minuto planejado. */
  inicioAula: number | null;
};

const CANAL = "fakegram-aula";
const CHAVE = "fakegram_aula_estado";
const INICIAL: EstadoAula = { indice: 0, revelado: false, fimCronometro: null, inicioAula: null };

function lerSalvo(): EstadoAula {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as Partial<EstadoAula> | null;
    if (!bruto || typeof bruto !== "object") return INICIAL;
    return {
      indice: limitarIndice(Number(bruto.indice) || 0),
      revelado: bruto.revelado === true,
      fimCronometro: typeof bruto.fimCronometro === "number" ? bruto.fimCronometro : null,
      inicioAula: typeof bruto.inicioAula === "number" ? bruto.inicioAula : null,
    };
  } catch {
    return INICIAL;
  }
}

function salvar(estado: EstadoAula) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* sem localStorage a aula funciona, só não lembra o slide */
  }
}

/**
 * Estado da aula sincronizado entre as janelas do mesmo navegador.
 * A apresentação no projetor e o painel do instrutor mudam de slide juntos.
 */
export function useAulaSync() {
  const [estado, setEstado] = useState<EstadoAula>(INICIAL);
  const atual = useRef<EstadoAula>(INICIAL);
  const canal = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const salvo = lerSalvo();
    // ?s=12 abre no slide 12. O parâmetro sai da URL para não vencer o slide salvo ao recarregar.
    const url = new URL(window.location.href);
    const pedido = url.searchParams.get("s");
    const inicial = pedido
      ? { ...salvo, indice: limitarIndice(Number(pedido) - 1), revelado: false }
      : salvo;
    if (pedido) {
      url.searchParams.delete("s");
      window.history.replaceState(window.history.state, "", url);
      salvar(inicial);
    }
    atual.current = inicial;
    setEstado(inicial);
    if (typeof BroadcastChannel === "undefined") return;
    const c = new BroadcastChannel(CANAL);
    c.onmessage = (evento: MessageEvent<EstadoAula>) => {
      atual.current = evento.data;
      setEstado(evento.data);
    };
    canal.current = c;
    return () => {
      c.close();
      canal.current = null;
    };
  }, []);

  const atualizar = useCallback((mudanca: Partial<EstadoAula>) => {
    const novo = { ...atual.current, ...mudanca };
    novo.indice = limitarIndice(novo.indice);
    atual.current = novo;
    setEstado(novo);
    salvar(novo);
    canal.current?.postMessage(novo);
  }, []);

  /** Trocar de slide esconde de novo as respostas do quiz. */
  const irPara = useCallback(
    (indice: number) => atualizar({ indice, revelado: false }),
    [atualizar],
  );

  return { estado, atualizar, irPara };
}

/** Setas, espaço, Home e End mudam de slide; R revela o quiz. */
export function useTeclasAula(
  estado: EstadoAula,
  irPara: (indice: number) => void,
  atualizar: (mudanca: Partial<EstadoAula>) => void,
  extras: Record<string, () => void> = {},
) {
  const extrasRef = useRef(extras);
  extrasRef.current = extras;
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const alvo = e.target as HTMLElement | null;
      if (
        alvo &&
        (alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName))
      ) {
        return;
      }
      const tecla = e.key.toLowerCase();
      if (["arrowright", "pagedown", " "].includes(tecla)) irPara(estado.indice + 1);
      else if (["arrowleft", "pageup"].includes(tecla)) irPara(estado.indice - 1);
      else if (tecla === "home") irPara(0);
      else if (tecla === "end") irPara(Number.MAX_SAFE_INTEGER);
      else if (tecla === "r") atualizar({ revelado: !estado.revelado });
      else {
        const extra = extrasRef.current[tecla];
        if (!extra) return;
        extra();
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [estado.indice, estado.revelado, irPara, atualizar]);
}

/** Hora atual que avança a cada segundo. Fica null até a página hidratar. */
export function useAgora(): number | null {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return agora;
}

/** 125 segundos → "2:05". Negativo vira "0:00". */
export function relogio(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** "min 10–12", ou "antes da aula" para o que acontece na chegada. */
export function faixaDeMinutos([inicio, fim]: [number, number]) {
  return inicio < 0 ? "antes da aula" : `min ${inicio}–${fim}`;
}
