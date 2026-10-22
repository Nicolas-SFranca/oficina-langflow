import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NOMES_DIAGRAMAS } from "@/components/aula/diagramas";
import { ProvedorAula, SlideConteudo } from "@/components/aula/slide";
import { BLOCOS, SLIDES, limitarIndice } from "@/content/aula";
import { NOTAS_DO_INSTRUTOR } from "@/content/aula.instrutor";
import { relogio, tokenizar } from "@/lib/aula";
import { routeTree } from "@/routeTree.gen";

describe("conteúdo da aula", () => {
  it("numera os slides em sequência, sem repetir", () => {
    expect(SLIDES.map((s) => s.id)).toEqual(
      SLIDES.map((_, i) => `S${String(i + 1).padStart(2, "0")}`),
    );
  });

  it("põe cada slide num bloco que existe, dentro do horário do bloco", () => {
    for (const slide of SLIDES) {
      const bloco = BLOCOS.find((b) => b.id === slide.bloco);
      expect(bloco, slide.id).toBeDefined();
      const [inicio, fim] = slide.minutos;
      expect(inicio, slide.id).toBeLessThanOrEqual(fim);
      expect(inicio, slide.id).toBeGreaterThanOrEqual(bloco!.inicio);
      expect(fim, slide.id).toBeLessThanOrEqual(bloco!.fim);
    }
  });

  it("não volta no tempo de um slide para o seguinte", () => {
    for (let i = 1; i < SLIDES.length; i++) {
      expect(SLIDES[i]!.minutos[0], SLIDES[i]!.id).toBeGreaterThanOrEqual(
        SLIDES[i - 1]!.minutos[0],
      );
    }
  });

  it("fecha a aula em 150 minutos", () => {
    expect(BLOCOS.at(-1)?.fim).toBe(150);
    expect(SLIDES.at(-1)?.minutos[1]).toBe(150);
  });

  it("só usa diagramas que existem", () => {
    for (const slide of SLIDES) {
      for (const bloco of slide.conteudo) {
        if (bloco.tipo === "diagrama") expect(NOMES_DIAGRAMAS, slide.id).toContain(bloco.nome);
      }
    }
  });

  it("tem a resposta certa entre as opções de cada quiz", () => {
    for (const slide of SLIDES) {
      for (const bloco of slide.conteudo) {
        if (bloco.tipo === "quiz") expect(bloco.opcoes[bloco.correta], slide.id).toBeDefined();
      }
    }
  });

  it("liga cada nota do instrutor a um título de slide, sem título repetido", () => {
    const titulos = SLIDES.map((s) => s.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
    for (const titulo of Object.keys(NOTAS_DO_INSTRUTOR)) expect(titulos).toContain(titulo);
  });
});

describe("tokenizar", () => {
  it("devolve o texto original quando os tokens são juntados", () => {
    const texto = "O desenvolvimento de agentes de IA com Langflow é divertido!";
    expect(tokenizar(texto).join("")).toBe(texto);
  });

  it("quebra palavra longa e mantém palavra curta inteira", () => {
    expect(tokenizar("desenvolvimento").length).toBeGreaterThan(1);
    expect(tokenizar("café")).toEqual(["café"]);
  });

  it("devolve lista vazia para texto vazio", () => {
    expect(tokenizar("")).toEqual([]);
  });
});

describe("relógio e índice", () => {
  it("formata segundos como minutos:segundos", () => {
    expect(relogio(125)).toBe("2:05");
    expect(relogio(-3)).toBe("0:00");
  });

  it("mantém o índice dentro da lista de slides", () => {
    expect(limitarIndice(-4)).toBe(0);
    expect(limitarIndice(999)).toBe(SLIDES.length - 1);
  });
});

describe("rotas da aula", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it.each(["/aula", "/aula/apresentador", "/aula/estudo"])("encontra uma página para %s", (url) => {
    expect(router.matchRoutes(url).at(-1)?.routeId).not.toBe(rootRouteId);
  });
});

describe("renderização", () => {
  it.each(SLIDES.map((s) => [s.id, s] as const))(
    "mostra o %s no material de estudo",
    (_, slide) => {
      const { container } = render(
        <ProvedorAula
          value={{ modo: "documento", miniatura: false, revelado: null, fimCronometro: null }}
        >
          <SlideConteudo slide={slide} />
        </ProvedorAula>,
      );
      expect(container.textContent?.length ?? 0).toBeGreaterThan(0);
    },
  );
});
