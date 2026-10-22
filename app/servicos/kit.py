"""Monta os zips do aluno a partir de kit_template.

O kit do grupo leva o token e sai durante a aula. O kit de estudo não leva token,
inclui a pasta gabarito e só sai depois que o instrutor libera.
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


def _montar(arquivos: list[tuple[Path, str]], trocas: dict[str, str]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as arquivo:
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
    """Kit para estudar depois da aula: sem token, sem senha do banco e com os gabaritos."""
    trocas = _trocas(
        token="cole-aqui-o-token-do-seu-grupo",
        grupo="estudo",
        perfil="<handle-da-sua-marca>",
        neon_ro_url="",
    )
    arquivos = list(_arquivos(PASTA)) + list(_arquivos(GABARITO, prefixo="gabarito/"))
    return _montar(arquivos, trocas), "kit-de-estudo-fakegram.zip"
