-- Estrutura do Fakegram. O exercício 2 lê os comentários abaixo para entender o banco.

CREATE TABLE perfis (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    handle text NOT NULL UNIQUE,
    nome text NOT NULL,
    avatar_url text NOT NULL DEFAULT '',
    bio text NOT NULL DEFAULT '',
    categoria text NOT NULL DEFAULT '',
    seguidores integer NOT NULL DEFAULT 0 CHECK (seguidores >= 0)
);

COMMENT ON TABLE perfis IS
    'Marcas fictícias da rede. O handle é o nome curto, sem arroba, usado na URL.';
COMMENT ON COLUMN perfis.handle IS 'Identificador único da marca, por exemplo graofino.';
COMMENT ON COLUMN perfis.nome IS 'Nome de exibição da marca.';
COMMENT ON COLUMN perfis.avatar_url IS 'Endereço da imagem redonda do perfil.';
COMMENT ON COLUMN perfis.bio IS 'Texto curto da apresentação da marca.';
COMMENT ON COLUMN perfis.categoria IS 'Ramo da marca, por exemplo café ou pet shop.';
COMMENT ON COLUMN perfis.seguidores IS 'Número de seguidores mostrado no perfil. Não muda com as ações dos agentes.';

CREATE TABLE grupos (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome text NOT NULL,
    token text NOT NULL UNIQUE,
    ativo boolean NOT NULL DEFAULT true,
    perfil_id integer NOT NULL UNIQUE REFERENCES perfis (id) ON DELETE CASCADE,
    pontos integer NOT NULL DEFAULT 0
);

COMMENT ON TABLE grupos IS
    'Cada grupo de alunos administra um único perfil. O token é a senha do grupo na API e no MCP.';
COMMENT ON COLUMN grupos.nome IS 'Nome do grupo, por exemplo Grupo 3.';
COMMENT ON COLUMN grupos.token IS 'Segredo enviado como Authorization: Bearer. Não aparece para o usuário de leitura.';
COMMENT ON COLUMN grupos.ativo IS 'Falso depois que o instrutor revoga o grupo.';
COMMENT ON COLUMN grupos.perfil_id IS 'Perfil que este grupo administra. Só pode haver um grupo por perfil.';
COMMENT ON COLUMN grupos.pontos IS 'Placar do grupo. Sobe ou desce conforme as ações do agente.';

CREATE TABLE posts (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    perfil_id integer NOT NULL REFERENCES perfis (id) ON DELETE CASCADE,
    legenda text NOT NULL CHECK (char_length(legenda) <= 1000),
    imagem_url text NOT NULL DEFAULT '',
    hashtags text[] NOT NULL DEFAULT '{}',
    origem text NOT NULL CHECK (origem IN ('seed', 'agente', 'humano')),
    criado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE posts IS
    'Publicações da rede. A legenda tem no máximo 1000 caracteres.';
COMMENT ON COLUMN posts.perfil_id IS 'Marca dona do post.';
COMMENT ON COLUMN posts.legenda IS 'Texto do post, até 1000 caracteres.';
COMMENT ON COLUMN posts.imagem_url IS 'Endereço da foto quadrada.';
COMMENT ON COLUMN posts.hashtags IS 'Lista de hashtags, sem o caractere #.';
COMMENT ON COLUMN posts.origem IS 'Quem criou: seed (dados iniciais), agente ou humano.';
COMMENT ON COLUMN posts.criado_em IS 'Instante da publicação, em UTC.';

CREATE INDEX idx_posts_criado_em ON posts (criado_em);
CREATE INDEX idx_posts_perfil_id ON posts (perfil_id);

CREATE TABLE comentarios (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id integer NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    autor text NOT NULL,
    texto text NOT NULL CHECK (char_length(texto) <= 500),
    origem text NOT NULL CHECK (origem IN ('seed', 'agente', 'simulador')),
    oculto boolean NOT NULL DEFAULT false,
    resposta_de_id integer REFERENCES comentarios (id) ON DELETE CASCADE,
    criado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE comentarios IS
    'Comentários e respostas. Uma resposta aponta para o comentário original em resposta_de_id.';
COMMENT ON COLUMN comentarios.post_id IS 'Post em que o comentário foi escrito.';
COMMENT ON COLUMN comentarios.autor IS 'Nome de quem comentou. Não é uma chave para perfis.';
COMMENT ON COLUMN comentarios.texto IS 'Conteúdo do comentário ou da resposta, até 500 caracteres.';
COMMENT ON COLUMN comentarios.origem IS 'Quem escreveu: seed, agente ou simulador (o instrutor gerou o comentário).';
COMMENT ON COLUMN comentarios.oculto IS 'Verdadeiro quando a moderação escondeu o comentário.';
COMMENT ON COLUMN comentarios.resposta_de_id IS 'Comentário ao qual esta linha responde. Nulo quando é um comentário raiz.';
COMMENT ON COLUMN comentarios.criado_em IS 'Instante do comentário, em UTC.';

CREATE INDEX idx_comentarios_post_id ON comentarios (post_id);
CREATE INDEX idx_comentarios_criado_em ON comentarios (criado_em);

CREATE TABLE curtidas (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id integer NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    autor text NOT NULL,
    grupo_id integer REFERENCES grupos (id) ON DELETE CASCADE,
    criado_em timestamptz NOT NULL DEFAULT now(),
    UNIQUE (post_id, autor)
);

COMMENT ON TABLE curtidas IS
    'Uma linha por curtida. O mesmo autor não curte o mesmo post duas vezes.';
COMMENT ON COLUMN curtidas.post_id IS 'Post curtido.';
COMMENT ON COLUMN curtidas.autor IS 'Quem curtiu. Pode ser um nome solto ou o nome de um grupo.';
COMMENT ON COLUMN curtidas.grupo_id IS 'Grupo que curtiu. Fica nulo quando a curtida não veio de um grupo.';
COMMENT ON COLUMN curtidas.criado_em IS 'Instante da curtida, em UTC.';

CREATE INDEX idx_curtidas_post_id ON curtidas (post_id);
CREATE INDEX idx_curtidas_criado_em ON curtidas (criado_em);

CREATE TABLE acoes_agente (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    grupo_id integer NOT NULL REFERENCES grupos (id) ON DELETE CASCADE,
    ferramenta text NOT NULL,
    parametros jsonb NOT NULL DEFAULT '{}',
    resultado text NOT NULL DEFAULT '',
    resumo text NOT NULL DEFAULT '',
    sucesso boolean NOT NULL,
    pontos integer NOT NULL DEFAULT 0,
    criado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE acoes_agente IS
    'Diário de tudo que um grupo fez pela API ou pelo MCP. Os alunos de leitura não enxergam esta tabela.';
COMMENT ON COLUMN acoes_agente.grupo_id IS 'Grupo que executou a ação.';
COMMENT ON COLUMN acoes_agente.ferramenta IS 'Nome da ferramenta, por exemplo responder_comentario ou publicar_post.';
COMMENT ON COLUMN acoes_agente.parametros IS 'Argumentos recebidos, em JSON.';
COMMENT ON COLUMN acoes_agente.resultado IS 'Resposta da operação, em texto.';
COMMENT ON COLUMN acoes_agente.resumo IS 'Frase curta mostrada no feed ao vivo, por exemplo "Grupo 3 respondeu um comentário".';
COMMENT ON COLUMN acoes_agente.sucesso IS 'Falso quando a ação foi recusada ou deu erro.';
COMMENT ON COLUMN acoes_agente.pontos IS 'Pontos somados ao grupo por esta ação. Pode ser negativo.';
COMMENT ON COLUMN acoes_agente.criado_em IS 'Instante da ação, em UTC.';

CREATE INDEX idx_acoes_agente_criado_em ON acoes_agente (criado_em);

CREATE TABLE gabarito_comentarios (
    comentario_id integer PRIMARY KEY REFERENCES comentarios (id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (
        tipo IN ('normal', 'elogio', 'duvida', 'reclamacao', 'spam', 'ofensivo')
    )
);

COMMENT ON TABLE gabarito_comentarios IS
    'Classificação secreta de cada comentário, usada só para a pontuação. Os alunos não podem ler esta tabela.';
COMMENT ON COLUMN gabarito_comentarios.comentario_id IS 'Comentário classificado.';
COMMENT ON COLUMN gabarito_comentarios.tipo IS
    'Tipo esperado: normal, elogio, duvida, reclamacao, spam ou ofensivo.';

CREATE TABLE config (
    chave text PRIMARY KEY,
    valor text NOT NULL
);

COMMENT ON TABLE config IS
    'Ajustes gerais da oficina, no formato chave e valor. Os alunos não podem ler esta tabela.';
COMMENT ON COLUMN config.chave IS 'Nome do ajuste. O valor pausado liga ou desliga os agentes.';
COMMENT ON COLUMN config.valor IS 'Conteúdo do ajuste, sempre texto. pausado usa true ou false.';

INSERT INTO config (chave, valor) VALUES ('pausado', 'false');

-- Hora e dia da semana usam o fuso de Brasília, para a pergunta "que horário dá mais curtidas?".
CREATE VIEW vw_engajamento_posts AS
SELECT
    posts.id AS post_id,
    perfis.handle AS perfil,
    posts.legenda,
    posts.criado_em,
    EXTRACT(HOUR FROM posts.criado_em AT TIME ZONE 'America/Sao_Paulo')::integer AS hora_publicacao,
    CASE EXTRACT(DOW FROM posts.criado_em AT TIME ZONE 'America/Sao_Paulo')::integer
        WHEN 0 THEN 'domingo'
        WHEN 1 THEN 'segunda-feira'
        WHEN 2 THEN 'terça-feira'
        WHEN 3 THEN 'quarta-feira'
        WHEN 4 THEN 'quinta-feira'
        WHEN 5 THEN 'sexta-feira'
        ELSE 'sábado'
    END AS dia_semana,
    cardinality(posts.hashtags) AS qtd_hashtags,
    strpos(posts.legenda, '?') > 0 AS tem_pergunta,
    (SELECT count(*) FROM curtidas WHERE curtidas.post_id = posts.id) AS curtidas,
    (SELECT count(*) FROM comentarios WHERE comentarios.post_id = posts.id) AS comentarios
FROM posts
JOIN perfis ON perfis.id = posts.perfil_id;

COMMENT ON VIEW vw_engajamento_posts IS
    'Um post por linha, com curtidas, comentários e o dia da semana em português. Hora e dia estão no fuso de Brasília.';

CREATE VIEW vw_engajamento_por_hora AS
SELECT
    hora_publicacao AS hora,
    count(*) AS posts,
    round(avg(curtidas)::numeric, 2) AS media_curtidas,
    round(avg(comentarios)::numeric, 2) AS media_comentarios
FROM vw_engajamento_posts
GROUP BY hora_publicacao;

COMMENT ON VIEW vw_engajamento_por_hora IS
    'Média de curtidas e de comentários dos posts agrupados pela hora de Brasília (0 a 23).';

CREATE VIEW vw_engajamento_por_dia_semana AS
SELECT
    dia_semana,
    count(*) AS posts,
    round(avg(curtidas)::numeric, 2) AS media_curtidas,
    round(avg(comentarios)::numeric, 2) AS media_comentarios
FROM vw_engajamento_posts
GROUP BY dia_semana;

COMMENT ON VIEW vw_engajamento_por_dia_semana IS
    'Média de curtidas e de comentários dos posts agrupados pelo dia da semana, em português.';
