"""Fila de comentários: o perfil inteiro de uma vez, a mesma conta do painel e o seed na frente."""

from datetime import datetime

from app.db import consultar


def _fila(cliente, auth, limite: int = 20) -> list[dict]:
    resposta = cliente.get("/api/grupo/fila", headers=auth, params={"limite": limite})
    assert resposta.status_code == 200
    return resposta.json()


def _instante(texto: str) -> datetime:
    return datetime.fromisoformat(texto.replace("Z", "+00:00"))


def test_fila_exige_token(cliente):
    resposta = cliente.get("/api/grupo/fila")
    assert resposta.status_code == 401
    assert "erro" in resposta.json()


def test_fila_traz_so_pendentes_do_proprio_perfil(cliente, auth):
    fila = _fila(cliente, auth)
    assert fila, "o seed deixa comentários sem resposta para o Grupo 1"
    do_perfil = {
        linha["id"]
        for linha in consultar(
            """
            SELECT posts.id FROM posts
            JOIN perfis ON perfis.id = posts.perfil_id
            WHERE perfis.handle = 'graofino'
            """
        )
    }
    assert all(item["post_id"] in do_perfil for item in fila)
    assert all(item["resposta_de_id"] is None and not item["oculto"] for item in fila)
    instantes = [_instante(item["criado_em"]) for item in fila]
    assert instantes == sorted(instantes, reverse=True)


def test_fila_conta_o_mesmo_que_o_painel(cliente, auth):
    fila = _fila(cliente, auth, limite=50)
    painel = cliente.get("/api/grupo/me", headers=auth).json()
    assert len(fila) == painel["metricas"]["comentarios_sem_resposta"]


def test_comentario_respondido_sai_da_fila(cliente, auth):
    primeiro = _fila(cliente, auth)[0]
    resposta = cliente.post(
        f"/api/grupo/comentarios/{primeiro['id']}/responder",
        headers=auth,
        json={"texto": "Obrigado pelo comentário!"},
    )
    assert resposta.status_code == 200
    assert primeiro["id"] not in {item["id"] for item in _fila(cliente, auth)}


def test_seed_poe_a_fila_nos_posts_mais_novos(cliente):
    from app.servicos.seed import POSTS_COM_FILA

    for perfil in consultar("SELECT id, handle FROM perfis"):
        mais_novos = {
            linha["id"]
            for linha in consultar(
                """
                SELECT id FROM posts
                WHERE perfil_id = %s AND origem = 'seed'
                ORDER BY criado_em DESC
                LIMIT %s
                """,
                (perfil["id"], POSTS_COM_FILA),
            )
        }
        com_fila = {
            linha["post_id"]
            for linha in consultar(
                """
                SELECT DISTINCT comentarios.post_id
                FROM comentarios
                JOIN posts ON posts.id = comentarios.post_id
                WHERE posts.perfil_id = %s
                  AND comentarios.origem = 'seed'
                  AND comentarios.criado_em > now() - interval '24 hours'
                """,
                (perfil["id"],),
            )
        }
        assert com_fila, perfil["handle"]
        assert com_fila <= mais_novos, perfil["handle"]


def test_seed_poe_uma_injecao_de_prompt_na_fila_de_cada_marca(cliente):
    from app.servicos.seed import INJECAO_DE_PROMPT

    linhas = consultar(
        """
        SELECT perfis.handle, gabarito_comentarios.tipo
        FROM comentarios
        JOIN posts ON posts.id = comentarios.post_id
        JOIN perfis ON perfis.id = posts.perfil_id
        JOIN gabarito_comentarios ON gabarito_comentarios.comentario_id = comentarios.id
        WHERE comentarios.texto = %s AND comentarios.origem = 'seed'
          AND comentarios.criado_em > now() - interval '24 hours'
        """,
        (INJECAO_DE_PROMPT,),
    )
    total_de_perfis = consultar("SELECT count(*) AS n FROM perfis")[0]["n"]
    assert len({linha["handle"] for linha in linhas}) == total_de_perfis
    assert all(linha["tipo"] == "spam" for linha in linhas)
