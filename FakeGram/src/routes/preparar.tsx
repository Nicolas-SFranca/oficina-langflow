import { createFileRoute, Link } from "@tanstack/react-router";
import { CodeBlock, PageTitle } from "@/components/fg";
import { useChecks } from "@/lib/util";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/preparar")({
  head: () => ({
    meta: [
      { title: "Antes da aula · Fakegram" },
      {
        name: "description",
        content: "O que instalar e testar antes da oficina de Langflow, MCP e RAG.",
      },
      { property: "og:title", content: "Antes da aula · Fakegram" },
      { property: "og:description", content: "Checklist para chegar pronto na oficina." },
    ],
  }),
  component: Preparar,
});

type Item = { titulo: string; texto: string; codigo?: string };

const ITENS: Item[] = [
  {
    titulo: "Instale o Langflow Desktop",
    texto:
      "Baixe em langflow.org/desktop e abra uma vez. Pronto quando aparecer a tela de Projetos. No Windows, se o instalador pedir o C++ Build Tools, aceite.",
  },
  {
    titulo: "Tenha uma chave de modelo",
    texto:
      "Se o instrutor não avisou que vai entregar uma chave por grupo, crie a sua no Google AI Studio (Get API key). A chave é uma senha: não mande em grupo e não poste em lugar nenhum.",
  },
  {
    titulo: "Configure o modelo no Langflow",
    texto:
      'Abra o modelo Sugestões básicas, escolha o provedor Google Generative AI, cole a chave e mande "oi" no Playground. Se ele responder, está tudo certo.',
  },
  {
    titulo: "Tenha o Python 3.11 ou mais novo",
    texto:
      'Só o exercício 3 usa. Confira no PowerShell. Se não tiver, instale pelo python.org e marque "Add python.exe to PATH".',
    codigo: "python --version",
  },
  {
    titulo: "Traga o notebook carregado",
    texto: "E o carregador. A aula tem 2h30 de mão na massa.",
  },
];

function Preparar() {
  const [checks, alternar] = useChecks("fakegram_preparar");
  const feitos = ITENS.filter((_, i) => checks[i]).length;
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        titulo="Antes da aula"
        sub="Faça em casa, com calma. Quem chega com isto pronto começa a aula construindo."
      />
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(feitos / ITENS.length) * 100}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {feitos} de {ITENS.length} prontos
      </p>
      <ol className="mt-6 space-y-4">
        {ITENS.map((item, i) => (
          <li
            key={item.titulo}
            className={cn("rounded-2xl border bg-card p-5 transition", checks[i] && "opacity-60")}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={!!checks[i]}
                onChange={() => alternar(String(i))}
                className="mt-1 h-5 w-5 accent-primary"
              />
              <div className="flex-1">
                <h2 className="font-semibold">
                  <span className="mr-2 font-mono text-primary">{i + 1}.</span>
                  {item.titulo}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.texto}</p>
              </div>
            </label>
            {item.codigo && (
              <div className="mt-3">
                <CodeBlock codigo={item.codigo} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">No dia</p>
        <p className="mt-1">
          Vocês formam grupos de 3 ou 4 pessoas e recebem o token do grupo. Cada grupo cuida de uma
          marca no Fakegram. Quer adiantar a leitura? O{" "}
          <Link to="/aula/estudo" className="text-primary hover:underline">
            material da aula
          </Link>{" "}
          já está aberto.
        </p>
      </div>
    </div>
  );
}
