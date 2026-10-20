"""Regras do contrato: permissão, pausa, limite e pontuação."""

from app.db import consultar_um


def _comentario(handle: str, tipo: str) -> int:
    linha = consultar_um(
        """
        SELECT comentarios.id
        FROM comentarios
        JOIN gabarito_comentarios ON gabarito_comentarios.comentario_id = comentarios.id
        JOIN posts ON posts.id = comentarios.post_id
        JOIN perfis ON perfis.id = posts.perfil_id
        WHERE perfis.handle = %s
          AND gabarito_comentarios.tipo = %s
          AND comentarios.oculto = false
          AND comentarios.resposta_de_id IS NULL
        LIMIT 1
        """,
        (handle, tipo),
    )
    assert linha is not None, f"faltou comentário {tipo} em @{handle}"
    return linha["id"]


def _post(handle: str) -> int:
    linha = consultar_um(
        """
        SELECT posts.id
        FROM posts
        JOIN perfis ON perfis.id = posts.perfil_id
        WHERE perfis.handle = %s
        LIMIT 1
        """,
        (handle,),
    )
    assert linha is not None
    return linha["id"]


def _pontos() -> int:
    return consultar_um("SELECT pontos FROM grupos WHERE nome = 'Grupo 1'")["pontos"]


def test_token_invalido_retorna_401(cliente):
    resposta = cliente.get("/api/grupo/me", headers={"Authorization": "Bearer token-invalido"})
    assert resposta.status_code == 401
    assert "erro" in resposta.json()


def test_responder_comentario_de_outro_perfil_retorna_403(cliente, auth):
    comentario_id = _comentario("bikeurbana", "normal")
    resposta = cliente.post(
        f"/api/grupo/comentarios/{comentario_id}/responder",
        headers=auth,
        json={"texto": "Essa resposta não deveria entrar."},
    )
    assert resposta.status_code == 403
    assert "erro" in resposta.json()


def test_curtir_o_proprio_post_retorna_403(cliente, auth):
    resposta = cliente.post(f"/api/grupo/posts/{_post('graofino')}/curtir", headers=auth)
    assert resposta.status_code == 403
    assert "erro" in resposta.json()


def test_pausado_retorna_423(cliente, auth, admin):
    pausa = cliente.post("/api/admin/pausar", headers=admin, json={"pausado": True})
    assert pausa.status_code == 200
    assert pausa.json() == {"pausado": True}
    resposta = cliente.post(f"/api/grupo/posts/{_post('bikeurbana')}/curtir", headers=auth)
    assert resposta.status_code == 423
    assert resposta.json()["erro"] == "Agentes pausados pelo instrutor"


def test_limite_de_acoes_retorna_429(cliente, auth):
    from app.config import config

    post_id = _post("estudiopixel")
    resposta = None
    for _ in range(config.limite_acoes_por_minuto + 1):
        resposta = cliente.post(f"/api/grupo/posts/{post_id}/curtir", headers=auth)
    assert resposta is not None
    assert resposta.status_code == 429
    assert "erro" in resposta.json()


def test_ocultar_spam_soma_3(cliente, auth):
    antes = _pontos()
    resposta = cliente.post(
        f"/api/grupo/comentarios/{_comentario('graofino', 'spam')}/ocultar",
        headers=auth,
        json={"motivo": "spam"},
    )
    assert resposta.status_code == 200
    assert resposta.json()["pontos_ganhos"] == 3
    assert _pontos() == antes + 3


def test_ocultar_elogio_tira_2(cliente, auth):
    antes = _pontos()
    resposta = cliente.post(
        f"/api/grupo/comentarios/{_comentario('graofino', 'elogio')}/ocultar",
        headers=auth,
        json={"motivo": "não era ofensa"},
    )
    assert resposta.status_code == 200
    assert resposta.json()["pontos_ganhos"] == -2
    assert _pontos() == antes - 2


def test_responder_duvida_duas_vezes_pontua_uma(cliente, auth):
    comentario_id = _comentario("graofino", "duvida")
    antes = _pontos()
    primeira = cliente.post(
        f"/api/grupo/comentarios/{comentario_id}/responder",
        headers=auth,
        json={"texto": "Pode deixar que a gente responde."},
    )
    segunda = cliente.post(
        f"/api/grupo/comentarios/{comentario_id}/responder",
        headers=auth,
        json={"texto": "Só confirmando a resposta."},
    )
    assert primeira.status_code == 200
    assert segunda.status_code == 200
    assert _pontos() == antes + 2
