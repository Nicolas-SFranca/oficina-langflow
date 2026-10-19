"""Aplica os arquivos de migrations/, cada um uma vez só."""

from pathlib import Path

import psycopg
from psycopg.pq import ExecStatus

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "migrations"
PLACEHOLDER = ":'senha_aluno'"


def ler_env(caminho: Path) -> dict[str, str]:
    """Lê o .env da raiz. O valor do arquivo ganha do ambiente da sessão."""
    valores: dict[str, str] = {}
    if not caminho.exists():
        return valores
    for linha in caminho.read_text(encoding="utf-8").splitlines():
        texto = linha.strip()
        if not texto or texto.startswith("#") or "=" not in texto:
            continue
        chave, valor = texto.split("=", 1)
        valores[chave.strip()] = valor.strip().strip('"').strip("'")
    return valores


def literal_sql(valor: str) -> str:
    """Coloca o texto entre aspas simples, dobrando aspas que já existirem."""
    return "'" + valor.replace("'", "''") + "'"


def executar_script(conexao: psycopg.Connection, script: str) -> None:
    """Manda o arquivo inteiro numa transação só.

    O Postgres devolve só o resultado do último comando. Se algum falha,
    a transação inteira é desfeita.
    """
    resultado = conexao.pgconn.exec_(script.encode("utf-8"))
    if resultado.status not in (ExecStatus.COMMAND_OK, ExecStatus.TUPLES_OK, ExecStatus.EMPTY_QUERY):
        raise RuntimeError(resultado.get_error_message() or "Falha ao aplicar a migration")


def preparar(texto: str, nome: str, senha_aluno: str) -> str:
    if PLACEHOLDER not in texto:
        script = texto
    else:
        if not senha_aluno:
            raise SystemExit(
                "Falta ALUNO_LEITURA_SENHA no .env. Essa senha vira o login do usuário aluno_leitura."
            )
        script = texto.replace(PLACEHOLDER, literal_sql(senha_aluno))
    nome_seguro = nome.replace("'", "''")
    return script.rstrip() + f"\nINSERT INTO schema_migrations (nome) VALUES ('{nome_seguro}');\n"


def main() -> None:
    ambiente = ler_env(RAIZ / ".env")
    url = ambiente.get("DATABASE_URL", "")
    if not url:
        raise SystemExit("Falta DATABASE_URL no .env.")

    arquivos = sorted(PASTA.glob("*.sql"))
    if not arquivos:
        raise SystemExit(f"Nenhum arquivo .sql em {PASTA}.")

    with psycopg.connect(url, autocommit=True, connect_timeout=30) as conexao:
        executar_script(
            conexao,
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                nome text PRIMARY KEY,
                aplicada_em timestamptz NOT NULL DEFAULT now()
            );
            COMMENT ON TABLE schema_migrations IS
                'Controle das migrations já aplicadas. Cada arquivo .sql entra aqui uma vez.';
            """,
        )
        with conexao.cursor() as cursor:
            cursor.execute("SELECT nome FROM schema_migrations")
            feitas = {linha[0] for linha in cursor.fetchall()}

        for arquivo in arquivos:
            if arquivo.name in feitas:
                print(f"já aplicada: {arquivo.name}")
                continue
            texto = arquivo.read_text(encoding="utf-8")
            script = preparar(texto, arquivo.name, ambiente.get("ALUNO_LEITURA_SENHA", ""))
            try:
                executar_script(conexao, script)
            except (psycopg.Error, RuntimeError) as erro:
                mensagem = str(erro)
                senha = ambiente.get("ALUNO_LEITURA_SENHA", "")
                if senha:
                    mensagem = mensagem.replace(senha, "[oculto]")
                raise SystemExit(f"Falhou em {arquivo.name}: {mensagem}") from None
            print(f"aplicada: {arquivo.name}")


if __name__ == "__main__":
    main()
