"""Pontos de cada ação. O tipo do comentário vem do gabarito, que o aluno não lê."""

PONTOS_CURTIDA_RECEBIDA = 1

PONTOS_POR_RESPOSTA = {
    "duvida": 2,
    "reclamacao": 2,
    "elogio": 1,
}


def pontos_da_resposta(tipo: str | None, ja_pontuou: bool) -> int:
    """Dúvida e reclamação dão 2, elogio dá 1. A segunda resposta do mesmo comentário não pontua."""
    if ja_pontuou:
        return 0
    return PONTOS_POR_RESPOSTA.get(tipo or "", 0)


def pontos_ao_ocultar(tipo: str | None) -> int:
    """Spam e ofensivo dão 3. Comentário legítimo tira 2."""
    if tipo in ("spam", "ofensivo"):
        return 3
    return -2


def pontos_do_post(posts_hoje: int) -> int:
    """Publicar dá 1 ponto, no máximo 5 vezes no mesmo dia."""
    if posts_hoje < 5:
        return 1
    return 0
