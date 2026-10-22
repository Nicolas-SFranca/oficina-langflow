"""O reset recria os seis grupos da turma e devolve os grupos extras, como o do instrutor."""

from app.db import consultar, consultar_um, transacao
from app.servicos.seed import recriar_dados


def _perfil(handle: str) -> int:
    return consultar_um("SELECT id FROM perfis WHERE handle = %s", (handle,))["id"]


def test_reset_preserva_grupo_extra_com_o_mesmo_token(cliente, admin):
    criado = cliente.post(
        "/api/admin/grupos",
        headers=admin,
        json={"nome": "Instrutor", "perfil_id": _perfil("bikeurbana")},
    )
    assert criado.status_code == 200, criado.text
    token = consultar_um("SELECT token FROM grupos WHERE nome = 'Instrutor'")["token"]
    try:
        recriar_dados()
        grupos = consultar(
            """
            SELECT grupos.nome, grupos.token, perfis.handle
            FROM grupos JOIN perfis ON perfis.id = grupos.perfil_id
            ORDER BY grupos.id
            """
        )
        nomes = [grupo["nome"] for grupo in grupos]
        assert nomes == [f"Grupo {n}" for n in range(1, 7)] + ["Instrutor"]
        assert grupos[-1]["token"] == token
        assert grupos[-1]["handle"] == "bikeurbana"
    finally:
        with transacao() as cursor:
            cursor.execute("DELETE FROM grupos WHERE nome = 'Instrutor'")
