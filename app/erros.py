"""Erro de regra de negócio, com o status HTTP que a rota deve devolver."""


class ErroAPI(Exception):
    def __init__(self, status: int, mensagem: str):
        self.status = status
        self.mensagem = mensagem
        super().__init__(mensagem)
