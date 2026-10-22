"""Servidor MCP na mesma API, em /mcp.

No SDK 2 o antigo FastMCP se chama MCPServer. O comportamento é o mesmo:
ferramentas com docstring, transporte Streamable HTTP e o header Authorization.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

from mcp.server.mcpserver import Context, MCPServer
from mcp.server.transport_security import TransportSecuritySettings

from app.dependencias import grupo_pelo_cabecalho, preparar_acao
from app.erros import ErroAPI
from app.servicos.comentarios import fila_do_grupo, listar_para_grupo, responder
from app.servicos.grupos import painel
from app.servicos.posts import curtir, listar_do_perfil, publicar
from app.servicos.posts import listar_feed as feed_do_servico

FUSO = ZoneInfo("America/Sao_Paulo")
MENSAGEM_TOKEN = (
    "Token do grupo ausente ou inválido. Configure o header Authorization: Bearer <token> no Langflow"
)

mcp = MCPServer("Fakegram")


def _cabecalho_autorizacao(ctx: Context) -> str | None:
    """Lê o header Authorization do pedido HTTP que chamou a ferramenta."""
    pedido = ctx.request_context.request
    cabecalhos = getattr(pedido, "headers", None) if pedido is not None else None
    if cabecalhos is None or not hasattr(cabecalhos, "get"):
        return None
    return cabecalhos.get("authorization")


def _grupo(ctx: Context) -> dict:
    try:
        return grupo_pelo_cabecalho(_cabecalho_autorizacao(ctx))
    except ErroAPI as erro:
        if erro.status == 401:
            raise ErroAPI(401, MENSAGEM_TOKEN) from None
        raise


def _acao(ctx: Context) -> dict:
    return preparar_acao(_grupo(ctx))


def _limite(valor: int) -> int:
    if valor < 1:
        return 1
    if valor > 20:
        return 20
    return valor


def _data_curta(texto: str) -> str:
    instante = datetime.fromisoformat(texto.replace("Z", "+00:00"))
    return instante.astimezone(FUSO).strftime("%d/%m %H:%M")


def _post_curto(item: dict) -> dict:
    return {
        "id": item["id"],
        "autor": item["perfil"]["handle"],
        "texto": item["legenda"],
        "data": _data_curta(item["criado_em"]),
    }


def _comentario_curto(item: dict) -> dict:
    return {
        "id": item["id"],
        "autor": item["autor"],
        "texto": item["texto"],
        "data": _data_curta(item["criado_em"]),
    }


@mcp.tool()
def meu_perfil(ctx: Context) -> dict:
    """Mostra o perfil que este grupo administra.

    Use no começo da conversa para saber o handle, os pontos e quantos
    comentários das últimas 24 horas ainda estão sem resposta. Para ver quais
    são, chame fila_de_comentarios. Não publica nem responde nada.
    """
    grupo = _grupo(ctx)
    dados = painel(grupo["id"])
    return {
        "grupo": dados["nome"],
        "handle": dados["perfil"]["handle"],
        "nome": dados["perfil"]["nome"],
        "pontos": dados["pontos"],
        "comentarios_sem_resposta": dados["metricas"]["comentarios_sem_resposta"],
    }


@mcp.tool()
def listar_feed(ctx: Context, limite: int = 10) -> list:
    """Lista posts recentes dos outros perfis, para descobrir o que curtir.

    Use quando quiser ver o feed fora do seu perfil. O parâmetro limite é
    quantos posts trazer, no máximo 20. O retorno traz id, autor, texto e data.
    Não use para ler os seus próprios posts: para isso chame listar_posts.
    """
    grupo = _grupo(ctx)
    posts = feed_do_servico(_limite(limite), None, None, exceto_handle=grupo["handle"])
    return [_post_curto(item) for item in posts]


@mcp.tool()
def listar_posts(ctx: Context, limite: int = 10) -> list:
    """Lista os posts do próprio perfil, do mais novo para o mais antigo.

    Use antes de ler_comentarios: o id que ela pede é o id devolvido aqui.
    O parâmetro limite é quantos posts trazer, no máximo 20.
    """
    grupo = _grupo(ctx)
    posts = listar_do_perfil(grupo["perfil_id"], _limite(limite))
    return [_post_curto(item) for item in posts]


@mcp.tool()
def fila_de_comentarios(ctx: Context, limite: int = 20) -> list:
    """Mostra de uma vez todos os comentários que esperam resposta no próprio perfil.

    É a fila de trabalho: comentários das últimas 24 horas, de todos os posts
    do perfil, que ninguém respondeu, do mais novo para o mais antigo. Use
    sempre que for responder ou moderar comentários. Cada item traz id,
    post_id, autor, texto e data. O id serve para responder_comentario. O
    parâmetro limite é quantos trazer, no máximo 20.
    """
    grupo = _grupo(ctx)
    fila = fila_do_grupo(grupo, _limite(limite))
    return [_comentario_curto(item) | {"post_id": item["post_id"]} for item in fila]


@mcp.tool()
def ler_comentarios(ctx: Context, post_id: int, apenas_sem_resposta: bool = True) -> list:
    """Lê os comentários de um post específico do próprio perfil.

    Para a fila do perfil inteiro, prefira fila_de_comentarios. Use esta
    quando quiser olhar um post só: o post_id vem de listar_posts. Com
    apenas_sem_resposta verdadeiro (o padrão), devolve só comentários das
    últimas 24 horas que ninguém respondeu, do mais novo para o mais antigo.
    É a fila de trabalho. Cada item traz id, autor, texto e data. O id serve
    para responder_comentario.
    """
    grupo = _grupo(ctx)
    comentarios = listar_para_grupo(grupo, post_id, apenas_sem_resposta)
    return [_comentario_curto(item) for item in comentarios[:20]]


@mcp.tool()
def responder_comentario(ctx: Context, comentario_id: int, texto: str) -> dict:
    """Responde um comentário de um post do próprio perfil.

    Use o comentario_id que veio de fila_de_comentarios. O parâmetro texto é a
    resposta, em português, com no máximo 500 caracteres. Só funciona no
    próprio perfil. Dúvida e reclamação pontuam uma vez por comentário.
    """
    grupo = _acao(ctx)
    criado = responder(grupo, comentario_id, texto)
    return _comentario_curto(criado)


# hashtags sem "| None": o Langflow transforma o anyOf de lista ou nulo num ARRAY sem
# items, e o Gemini recusa a ferramenta inteira com 400. A lista padrão nunca é alterada.
@mcp.tool()
def publicar_post(ctx: Context, legenda: str, hashtags: list[str] = []) -> dict:  # noqa: B006
    """Publica um post novo no próprio perfil.

    O parâmetro legenda é o texto do post, até 1000 caracteres. hashtags é uma
    lista de palavras, sem o #. Há limite de posts por hora. Use quando o
    grupo quiser publicar, não para responder comentário.
    """
    grupo = _acao(ctx)
    criado = publicar(grupo, legenda, hashtags or [])
    return _post_curto(criado)


@mcp.tool()
def curtir_post(ctx: Context, post_id: int) -> dict:
    """Curte um post de outro perfil.

    O post_id vem de listar_feed. Não curte post do próprio perfil. Se já
    tiver curtido, a ferramenta avisa em vez de curtir de novo.
    """
    grupo = _acao(ctx)
    resultado = curtir(grupo, post_id)
    return {"post_id": post_id, "curtidas": resultado["curtidas"]}


def mcp_disponivel() -> bool:
    """Verdadeiro depois que o lifespan da API iniciou o gerenciador do MCP."""
    try:
        return bool(getattr(mcp.session_manager, "_has_started", False))
    except Exception:
        return False


# Caminho "/" aqui. A API pendura este app em /mcp, senão a URL vira /mcp/mcp.
aplicacao_http = mcp.streamable_http_app(
    streamable_http_path="/",
    stateless_http=True,
    json_response=True,
    host="0.0.0.0",
    transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False),
)
