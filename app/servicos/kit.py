"""Monta os zips do aluno a partir de kit_template.

O kit do grupo leva o token e sai durante a aula. O kit de estudo não leva token,
inclui a pasta gabarito e o código do Fakegram, e só sai depois que o instrutor libera.
"""

import io
import zipfile
from collections.abc import Iterator
from pathlib import Path

from app.config import config
from app.erros import ErroAPI

RAIZ = Path(__file__).resolve().parents[2]
PASTA = RAIZ / "kit_template"
GABARITO = RAIZ / "gabarito"
MARCADORES = ("{{API_URL}}", "{{MCP_URL}}", "{{TOKEN}}", "{{GRUPO}}", "{{PERFIL}}", "{{NEON_RO_URL}}")

# O código do Fakegram que vai na pasta projeto/ do kit de estudo. Fica de fora o que não
# é código: segredos, dependências instaladas, saídas de build e o material do instrutor.
PROJETO = (
    "COMO_RODAR.md",
    "README.md",
    ".env.example",
    ".gitignore",
    "requirements.txt",
    "pyproject.toml",
    "vercel.json",
    "docs/CONTRATO_API.md",
    "app",
    "migrations",
    "scripts",
    "tests",
    "kit_template",
    "gabarito",
    "FakeGram",
)
PROJETO_PASTAS_FORA = {"__pycache__", ".pytest_cache", "node_modules", ".vercel", ".output", ".wrangler", ".lovable"}
PROJETO_ARQUIVOS_FORA = {
    "FakeGram/src/content/aula.instrutor.ts",
    "FakeGram/scripts/roteiro-instrutor.ts",
    "FakeGram/AGENTS.md",
    "FakeGram/bun.lock",
    "FakeGram/bunfig.toml",
}


def _nome_do_arquivo(nome_do_grupo: str) -> str:
    pedacos = [trecho for trecho in "".join(c if c.isalnum() else "-" for c in nome_do_grupo).split("-") if trecho]
    return f"kit-{'-'.join(pedacos) or 'grupo'}.zip"


def _trocas(token: str, grupo: str, perfil: str, neon_ro_url: str) -> dict[str, str]:
    api = config.public_api_url.rstrip("/")
    return {
        "{{API_URL}}": api,
        "{{MCP_URL}}": f"{api}/mcp",
        "{{TOKEN}}": token,
        "{{GRUPO}}": grupo,
        "{{PERFIL}}": perfil,
        "{{NEON_RO_URL}}": neon_ro_url,
    }


def _arquivos(pasta: Path, prefixo: str = "") -> Iterator[tuple[Path, str]]:
    if not pasta.is_dir():
        raise ErroAPI(500, f"A pasta {pasta.name} não está no servidor")
    for caminho in sorted(pasta.rglob("*")):
        if caminho.is_file() and "__pycache__" not in caminho.parts:
            yield caminho, prefixo + caminho.relative_to(pasta).as_posix()


def _segredo(relativo: str) -> bool:
    """Qualquer .env de verdade. O .env.example e o .env de marcadores do kit_template ficam."""
    nome = relativo.rsplit("/", 1)[-1]
    return nome.startswith(".env") and nome != ".env.example" and relativo != "kit_template/.env"


def _arquivos_do_projeto() -> Iterator[tuple[Path, str]]:
    for item in PROJETO:
        caminho = RAIZ / item
        candidatos = sorted(caminho.rglob("*")) if caminho.is_dir() else [caminho]
        for arquivo in candidatos:
            if not arquivo.is_file():
                continue
            relativo = arquivo.relative_to(RAIZ).as_posix()
            if PROJETO_PASTAS_FORA & set(arquivo.relative_to(RAIZ).parts):
                continue
            if relativo in PROJETO_ARQUIVOS_FORA or _segredo(relativo):
                continue
            yield arquivo, f"projeto/{relativo}"


def _montar(
    arquivos: list[tuple[Path, str]],
    trocas: dict[str, str],
    sem_trocas: list[tuple[Path, str]] | None = None,
) -> bytes:
    """sem_trocas vai como está: é código-fonte, e o kit.py e os testes contêm os marcadores."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as arquivo:
        for caminho, arco in sem_trocas or []:
            arquivo.writestr(arco, caminho.read_bytes())
        for caminho, arco in arquivos:
            bruto = caminho.read_bytes()
            try:
                texto = bruto.decode("utf-8")
            except UnicodeDecodeError:
                arquivo.writestr(arco, bruto)
                continue
            for marcador, valor in trocas.items():
                texto = texto.replace(marcador, valor)
            arquivo.writestr(arco, texto.encode("utf-8"))
    return buffer.getvalue()


def gerar_zip(grupo: dict) -> tuple[bytes, str]:
    """Kit do grupo, com o token. A pasta gabarito não entra."""
    trocas = _trocas(grupo["token"], grupo["nome"], grupo["handle"], config.neon_readonly_url)
    return _montar(list(_arquivos(PASTA)), trocas), _nome_do_arquivo(grupo["nome"])


def gerar_zip_de_estudo() -> tuple[bytes, str]:
    """Kit para estudar depois da aula: sem token, sem senha do banco, com os gabaritos e o código."""
    trocas = _trocas(
        token="cole-aqui-o-token-do-seu-grupo",
        grupo="estudo",
        perfil="<handle-da-sua-marca>",
        neon_ro_url="",
    )
    arquivos = list(_arquivos(PASTA)) + list(_arquivos(GABARITO, prefixo="gabarito/"))
    return _montar(arquivos, trocas, list(_arquivos_do_projeto())), "kit-de-estudo-fakegram.zip"
