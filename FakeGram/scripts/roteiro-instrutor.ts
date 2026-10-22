// Gera o roteiro do instrutor em HTML: o guia (docs/ROTEIRO_AULA.md), os slides com as notas
// de palco e os LEIAME dos exercícios. O arquivo sai em instrutor/, fora do git e do site.
//
// Na pasta FakeGram:  node --experimental-strip-types scripts/roteiro-instrutor.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BLOCOS, SLIDES, type Bloco, type Slide } from "../src/content/aula.ts";
import { NOTAS_DO_INSTRUTOR } from "../src/content/aula.instrutor.ts";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SAIDA = resolve(RAIZ, "instrutor/roteiro-instrutor.html");
const SITE = "https://fakegram-oficina.vercel.app";
const API = "https://oficina-langflow.vercel.app";
const INICIO_DA_AULA = 19 * 60;
const MARCA_DOS_SLIDES = "<!-- minuto-a-minuto -->";

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ancora(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** `código`, **negrito**, [texto](url) e endereços soltos. */
function inline(texto: string): string {
  return texto
    .split(/(`[^`]+`)/)
    .map((trecho) => {
      if (trecho.startsWith("`") && trecho.endsWith("`") && trecho.length > 1) {
        return `<code>${escapar(trecho.slice(1, -1))}</code>`;
      }
      return escapar(trecho)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
        .replace(
          /(^|[\s(])(https?:\/\/[^\s<)]+?)([.,;:]?)(?=$|[\s)<])/g,
          '$1<a href="$2">$2</a>$3',
        );
    })
    .join("");
}

// ---------- Markdown, só o que os nossos arquivos usam ----------

const MARCADOR_DE_LISTA = /^([-*]|\d+\.) (.*)$/;

function recuo(linha: string): number {
  return linha.length - linha.trimStart().length;
}

function tabela(linhas: string[]): string {
  const celulas = (linha: string) =>
    linha
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
  const [cabecalho = [], , ...corpo] = linhas.map(celulas);
  const th = cabecalho.map((c) => `<th>${inline(c)}</th>`).join("");
  const tr = corpo
    .map((linha) => `<tr>${linha.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="rolagem"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}

function lista(linhas: string[], inicio: number): [string, number] {
  const numerada = /^\d+\./.test(linhas[inicio]!.trim());
  const itens: string[] = [];
  let i = inicio;
  while (i < linhas.length) {
    const casamento = linhas[i]!.match(MARCADOR_DE_LISTA);
    if (!casamento || /^\d+\./.test(casamento[1]!) !== numerada) break;
    const largura = casamento[1]!.length + 1;
    const conteudo = [casamento[2]!];
    i++;
    while (i < linhas.length) {
      const linha = linhas[i]!;
      if (linha.trim() === "") {
        const proxima = linhas.slice(i + 1).find((l) => l.trim() !== "");
        if (proxima === undefined || recuo(proxima) < largura) break;
        conteudo.push("");
      } else if (recuo(linha) >= largura) {
        conteudo.push(linha.slice(largura));
      } else break;
      i++;
    }
    let corpo = markdown(conteudo.join("\n"));
    const marcar = corpo.match(/^<p>\[( |x)\] /);
    if (marcar) corpo = corpo.replace(/^<p>\[( |x)\] /, "<p>");
    if (/^<p>[\s\S]*?<\/p>$/.test(corpo) && corpo.indexOf("<p>", 1) === -1) {
      corpo = corpo.slice(3, -4);
    }
    itens.push(
      marcar
        ? `<li class="tarefa"><label><input type="checkbox"${marcar[1] === "x" ? " checked" : ""}> <span>${corpo}</span></label></li>`
        : `<li>${corpo}</li>`,
    );
    while (i < linhas.length && linhas[i]!.trim() === "") {
      const proxima = linhas.slice(i).find((l) => l.trim() !== "");
      if (!proxima || !MARCADOR_DE_LISTA.test(proxima)) break;
      i++;
    }
  }
  const tag = numerada ? "ol" : "ul";
  return [`<${tag}>${itens.join("")}</${tag}>`, i];
}

/** Converte markdown em HTML. `nivel` desloca os títulos: com 1, "##" vira h3. */
function markdown(texto: string, nivel = 0): string {
  const linhas = texto.replace(/\r/g, "").split("\n");
  const html: string[] = [];
  let i = 0;
  while (i < linhas.length) {
    const linha = linhas[i]!;
    if (linha.trim() === "") {
      i++;
    } else if (linha.trim() === MARCA_DOS_SLIDES) {
      html.push(MARCA_DOS_SLIDES);
      i++;
    } else if (linha.startsWith("```")) {
      const codigo: string[] = [];
      i++;
      while (i < linhas.length && !linhas[i]!.startsWith("```")) codigo.push(linhas[i++]!);
      i++;
      html.push(`<pre><code>${escapar(codigo.join("\n"))}</code></pre>`);
    } else if (/^#{1,6} /.test(linha)) {
      const marcas = linha.match(/^#+/)![0].length;
      const titulo = linha.slice(marcas + 1).trim();
      const h = Math.min(6, marcas + nivel);
      html.push(`<h${h} id="${ancora(titulo)}">${inline(titulo)}</h${h}>`);
      i++;
    } else if (linha.trimStart().startsWith("|")) {
      const bloco: string[] = [];
      while (i < linhas.length && linhas[i]!.trimStart().startsWith("|")) bloco.push(linhas[i++]!);
      html.push(tabela(bloco));
    } else if (MARCADOR_DE_LISTA.test(linha)) {
      const [lis, fim] = lista(linhas, i);
      html.push(lis);
      i = fim;
    } else if (linha.startsWith("> ")) {
      const citacao: string[] = [];
      while (i < linhas.length && linhas[i]!.startsWith("> ")) citacao.push(linhas[i++]!.slice(2));
      html.push(`<blockquote>${markdown(citacao.join("\n"))}</blockquote>`);
    } else {
      const paragrafo: string[] = [];
      while (
        i < linhas.length &&
        linhas[i]!.trim() !== "" &&
        !/^(#{1,6} |```|\||> )/.test(linhas[i]!.trimStart()) &&
        !MARCADOR_DE_LISTA.test(linhas[i]!)
      ) {
        paragrafo.push(linhas[i++]!.trim());
      }
      html.push(`<p>${inline(paragrafo.join(" "))}</p>`);
    }
  }
  return html.join("\n");
}

// ---------- Slides ----------

function hora(minuto: number): string {
  const total = INICIO_DA_AULA + minuto;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function faixa([inicio, fim]: [number, number]): string {
  const minutos = inicio === fim ? `min ${inicio}` : `min ${inicio}–${fim}`;
  return `${minutos} · ${hora(inicio)}–${hora(fim)}`;
}

function naTela(bloco: Bloco): string {
  switch (bloco.tipo) {
    case "texto":
      return `<p${bloco.grande ? ' class="grande"' : ""}>${inline(bloco.texto)}</p>`;
    case "lista": {
      const tag = bloco.numerada ? "ol" : "ul";
      return `<${tag}>${bloco.itens.map((item) => `<li>${inline(item)}</li>`).join("")}</${tag}>`;
    }
    case "tabela":
      return tabela([
        `| ${bloco.colunas.join(" | ")} |`,
        "|",
        ...bloco.linhas.map((linha) => `| ${linha.join(" | ")} |`),
      ]);
    case "codigo":
      return `<pre><code>${escapar(bloco.codigo)}</code></pre>`;
    case "diagrama":
      return `<p class="tela-extra">Diagrama: ${escapar(bloco.nome)}</p>`;
    case "imagem":
      return `<p class="tela-extra">Imagem: ${escapar(bloco.alt)}</p>`;
    case "cartoes":
      return `<ul>${bloco.itens.map((c) => `<li><strong>${inline(c.titulo)}:</strong> ${inline(c.texto)}</li>`).join("")}</ul>`;
    case "destaque":
      return `<blockquote>${inline(bloco.texto)}${bloco.autor ? ` <cite>${escapar(bloco.autor)}</cite>` : ""}</blockquote>`;
    case "tokenizador":
      return `<p class="tela-extra">Tokenizador ao vivo: digite uma frase da turma.</p>`;
    case "quiz":
      return `<p><strong>Quiz:</strong> ${inline(bloco.pergunta)}</p><ol class="quiz">${bloco.opcoes
        .map((o, n) => `<li${n === bloco.correta ? ' class="certa"' : ""}>${inline(o)}</li>`)
        .join("")}</ol>`;
    case "pratica":
      return `<div class="pratica"><p><strong>Prática · ${bloco.minutos} min.</strong> ${inline(bloco.objetivo)}</p><p><strong>Deu certo se:</strong> ${inline(bloco.deuCerto)}</p>${
        bloco.planoB ? `<p><strong>Plano B:</strong> ${inline(bloco.planoB)}</p>` : ""
      }</div>`;
    case "intervalo":
      return `<p class="tela-extra">Intervalo de ${bloco.minutos} min, com cronômetro.</p>`;
    case "qr": {
      const url = bloco.url.startsWith("/") ? SITE + bloco.url : bloco.url;
      return `<p class="tela-extra">QR code: <a href="${escapar(url)}">${escapar(url)}</a> · ${inline(bloco.legenda)}</p>`;
    }
    case "telao":
      return `<p class="tela-extra">Telão ao vivo: <a href="${SITE}/telao">${SITE}/telao</a></p>`;
  }
}

function slide(s: Slide): string {
  const nota = NOTAS_DO_INSTRUTOR[s.titulo];
  return `<article class="slide" id="${s.id}">
<header><span class="id">${s.id}</span><span class="tempo">${faixa(s.minutos)}</span></header>
<h3>${inline(s.titulo)}</h3>
<p class="fala">${inline(s.fala)}</p>
${s.pergunte ? `<p class="pergunte"><strong>Pergunte:</strong> ${inline(s.pergunte)}</p>` : ""}
${nota ? `<p class="nota"><strong>Nota de palco:</strong> ${inline(nota)}</p>` : ""}
<details><summary>O que está na tela</summary><div class="tela">${s.conteudo.map(naTela).join("\n")}</div></details>
${
  s.revisar
    ? `<details><summary>Para revisar (material de estudo)</summary><ul>${s.revisar.map((r) => `<li>${inline(r)}</li>`).join("")}</ul></details>`
    : ""
}
</article>`;
}

function minutoAMinuto(): string {
  const blocos = BLOCOS.map((bloco) => {
    const slides = SLIDES.filter((s) => s.bloco === bloco.id);
    return `<section class="bloco" id="bloco-${bloco.id}">
<h3 class="titulo-bloco">${escapar(bloco.titulo)} <span>${faixa([bloco.inicio, bloco.fim])}</span></h3>
${slides.map(slide).join("\n")}
</section>`;
  });
  return `<h2 id="minuto-a-minuto">Minuto a minuto</h2>
<p class="dica">Cada slide traz a fala, a pergunta para a turma e a nota de palco. O horário considera o início às ${hora(0)}. Use <button type="button" data-abrir>abrir tudo</button> para ver o que está na tela em cada slide.</p>
${blocos.join("\n")}`;
}

// ---------- Exercícios, como o aluno vê no kit ----------

function exercicio(caminho: string): string {
  const texto = readFileSync(resolve(RAIZ, caminho), "utf8")
    .replaceAll("{{MCP_URL}}", `${API}/mcp`)
    .replaceAll("{{API_URL}}", API)
    .replaceAll("{{PERFIL}}", "perfil-do-grupo");
  return `<section class="exercicio">${markdown(texto, 2)}</section>`;
}

// ---------- Página ----------

function indice(html: string): string {
  const itens = [...html.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map(
    ([, id, titulo]) => `<li><a href="#${id}">${titulo}</a></li>`,
  );
  return `<nav class="indice"><p>Neste roteiro</p><ol>${itens.join("")}</ol></nav>`;
}

const CSS = `
:root{--fundo:#f7f7f5;--cartao:#fff;--texto:#1b1b1f;--fraco:#5d5d66;--borda:#e2e2e6;--marca:#7c3aed;--marca-fundo:#f1eafe;--nota:#8a5a00;--nota-fundo:#fff4d6;--certo:#0f7b45}
@media (prefers-color-scheme:dark){:root{--fundo:#111114;--cartao:#1a1a1f;--texto:#ececf1;--fraco:#a1a1ab;--borda:#2c2c34;--marca:#b18cff;--marca-fundo:#271d3d;--nota:#ffcf6b;--nota-fundo:#2e2512;--certo:#4ade80}}
*{box-sizing:border-box}
body{margin:0;background:var(--fundo);color:var(--texto);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:860px;margin:0 auto;padding:24px 16px 80px}
a{color:var(--marca)}
h1{font-size:2rem;line-height:1.2;margin:0 0 4px}
h2{font-size:1.5rem;margin:56px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--borda)}
h3{font-size:1.2rem;margin:28px 0 8px}
h4,h5{margin:20px 0 6px}
code{font:0.9em ui-monospace,Consolas,monospace;background:var(--marca-fundo);padding:1px 5px;border-radius:4px}
pre{background:var(--cartao);border:1px solid var(--borda);border-radius:8px;padding:12px;overflow-x:auto}
pre code{background:none;padding:0}
.rolagem{overflow-x:auto}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:.95rem}
th,td{border:1px solid var(--borda);padding:6px 10px;text-align:left;vertical-align:top}
th{background:var(--cartao)}
blockquote{margin:12px 0;padding:8px 14px;border-left:3px solid var(--marca);background:var(--cartao)}
.subtitulo{color:var(--fraco);margin:0}
.aviso{margin:16px 0;padding:10px 14px;border-radius:8px;background:var(--nota-fundo);color:var(--nota)}
.indice{margin:24px 0;padding:14px 18px;background:var(--cartao);border:1px solid var(--borda);border-radius:10px}
.indice p{margin:0 0 6px;font-weight:600}
.indice ol{margin:0;padding-left:20px;columns:2;column-gap:24px}
@media (max-width:600px){.indice ol{columns:1}}
li.tarefa{list-style:none;margin-left:-20px}
li.tarefa input{margin-right:6px;transform:scale(1.15)}
li.tarefa input:checked + span{color:var(--fraco);text-decoration:line-through}
.titulo-bloco{margin-top:40px;color:var(--marca);font-size:1.25rem}
.titulo-bloco span{font:0.8rem ui-monospace,Consolas,monospace;color:var(--fraco);margin-left:8px}
.slide{background:var(--cartao);border:1px solid var(--borda);border-radius:12px;padding:14px 18px;margin:12px 0;break-inside:avoid}
.slide header{display:flex;gap:12px;font:0.8rem ui-monospace,Consolas,monospace;color:var(--fraco)}
.slide .id{color:var(--marca);font-weight:700}
.slide h3{margin:4px 0 8px}
.fala{font-size:1.08rem;margin:8px 0}
.pergunte{background:var(--marca-fundo);padding:8px 12px;border-radius:8px;margin:8px 0}
.nota{background:var(--nota-fundo);color:var(--nota);padding:8px 12px;border-radius:8px;margin:8px 0}
.nota code{background:transparent;border:1px solid currentColor}
details{margin-top:8px}
summary{cursor:pointer;color:var(--fraco);font-size:.9rem}
.tela{border-left:3px solid var(--borda);padding:4px 12px;margin-top:6px;font-size:.95rem}
.tela-extra{color:var(--fraco);font-style:italic}
.grande{font-size:1.15rem;font-weight:600}
.quiz .certa{color:var(--certo);font-weight:700}
.quiz .certa::after{content:"  ✓ resposta"}
.pratica{border:1px dashed var(--marca);border-radius:8px;padding:4px 12px}
.dica{color:var(--fraco)}
.dica button{font:inherit;color:var(--marca);background:none;border:1px solid var(--marca);border-radius:6px;padding:0 8px;cursor:pointer}
.exercicio{background:var(--cartao);border:1px solid var(--borda);border-radius:12px;padding:4px 18px 12px;margin:16px 0}
@media print{body{background:#fff;color:#000}.indice,.dica button{display:none}details{display:block}details>summary{display:none}.slide,.exercicio{border-color:#ccc}}
`;

const JS = `
document.querySelectorAll("[data-abrir]").forEach(function (botao) {
  botao.addEventListener("click", function () {
    var abrir = botao.textContent === "abrir tudo";
    document.querySelectorAll(".slide details").forEach(function (d) { d.open = abrir; });
    botao.textContent = abrir ? "fechar tudo" : "abrir tudo";
  });
});
var CHAVE = "roteiro-instrutor-marcados";
var caixas = Array.prototype.slice.call(document.querySelectorAll("li.tarefa input"));
var marcados = [];
try { marcados = JSON.parse(localStorage.getItem(CHAVE) || "[]"); } catch (e) {}
caixas.forEach(function (caixa, n) {
  if (marcados.indexOf(n) !== -1) caixa.checked = true;
  caixa.addEventListener("change", function () {
    var lista = [];
    caixas.forEach(function (c, m) { if (c.checked) lista.push(m); });
    try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch (e) {}
  });
});
`;

function pagina(): string {
  const guia = readFileSync(resolve(RAIZ, "docs/ROTEIRO_AULA.md"), "utf8").replace(/^# .*\n/, "");
  const corpo = markdown(guia).replace(MARCA_DOS_SLIDES, minutoAMinuto());
  const exercicios = `<h2 id="exercicios">Os exercícios, como os alunos veem no kit</h2>
<p class="dica">Os LEIAME do kit, com o endereço do MCP já preenchido. O token e o perfil vêm do kit de cada grupo.</p>
${[
  "kit_template/ex1/LEIAME.md",
  "kit_template/ex2/LEIAME.md",
  "kit_template/ex3/LEIAME.md",
  "kit_template/bonus/analista/LEIAME.md",
]
  .map(exercicio)
  .join("\n")}`;
  const conteudo = corpo + "\n" + exercicios;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Roteiro do instrutor</title>
<style>${CSS}</style>
</head>
<body>
<main>
<h1>Roteiro do instrutor</h1>
<p class="subtitulo">Oficina de Langflow, MCP e RAG · 2h30 · início às ${hora(0)}</p>
<p class="aviso">Arquivo só seu, gerado na sua máquina. Não publique: ele traz as notas de palco e as respostas dos quizzes.</p>
${indice(conteudo)}
${conteudo}
</main>
<script>${JS}</script>
</body>
</html>
`;
}

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, pagina());
console.log(`Roteiro gerado em ${SAIDA}`);
