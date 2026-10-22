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

type Item = { titulo: string; texto: string; passos?: string[]; aviso?: string; codigo?: string };

const ITENS: Item[] = [
  {
    titulo: "Instale o Langflow Desktop",
    texto:
      "Baixe em langflow.org/desktop e abra uma vez. Pronto quando aparecer a tela de Projetos. No Windows, se o instalador pedir o C++ Build Tools, aceite.",
  },
  {
    titulo: "Crie a sua chave gratuita do Gemini",
    texto:
      "A aula usa o Gemini, do Google, no nível gratuito, sem cartão de crédito. Cada pessoa cria a própria chave, na própria conta Google. Leva uns 2 minutos.",
    passos: [
      "Entre em aistudio.google.com/apikey com a sua conta Google pessoal. Conta da faculdade às vezes bloqueia o AI Studio.",
      "Clique em Get API key e depois em Create API key. Se ele pedir um projeto, crie um novo.",
      "Copie a chave na hora: ela aparece inteira só uma vez. Guarde num lugar seguro, como o gerenciador de senhas do navegador.",
    ],
    aviso:
      "A chave é uma senha: não mande no grupo, não poste e não coloque em código. No nível gratuito, o Google pode usar o que você envia para melhorar os produtos, então não cole dados pessoais nem de clientes.",
  },
  {
    titulo: "Configure o modelo no Langflow",
    texto:
      'Abra o modelo Sugestões básicas, escolha o provedor Google Generative AI, cole a chave e mande "oi" no Playground. Se ele responder, está tudo certo. Se aparecer erro 429 ou "quota", é o limite por minuto do nível gratuito: espere um pouco e tente de novo.',
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
            {item.passos && (
              <ol className="ml-8 mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {item.passos.map((passo) => (
                  <li key={passo}>{passo}</li>
                ))}
              </ol>
            )}
            {item.aviso && (
              <p className="ml-8 mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                {item.aviso}
              </p>
            )}
            {item.codigo && (
              <div className="mt-3">
                <CodeBlock codigo={item.codigo} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Não conseguiu criar a chave do Gemini?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <span className="text-foreground">OpenRouter:</span> uma conta em openrouter.ai dá
            acesso a modelos gratuitos (os que terminam em <code>:free</code>), sem cartão. O limite
            é baixo, por volta de 50 pedidos por dia, então use só como reserva. No Langflow,
            escolha o provedor OpenRouter.
          </li>
          <li>
            <span className="text-foreground">Ollama:</span> roda modelos no seu computador, sem
            chave e sem custo, se a máquina for boa (16 GB de memória ou mais). Modelos pequenos
            erram mais na hora de escolher ferramentas.
          </li>
          <li>Se nada der certo, faça a aula em dupla com quem tem chave.</li>
        </ul>
      </div>
      <div className="mt-4 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
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
