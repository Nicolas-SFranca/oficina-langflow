-- Usuário somente leitura do exercício 2.
-- O trecho :'senha_aluno' é trocado por scripts/migrar.py antes de este arquivo rodar.
-- No psql, o mesmo trecho funciona com: \set senha_aluno 'uma-senha'

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aluno_leitura') THEN
        CREATE ROLE aluno_leitura WITH LOGIN PASSWORD :'senha_aluno';
    ELSE
        ALTER ROLE aluno_leitura WITH LOGIN PASSWORD :'senha_aluno';
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO aluno_leitura;

GRANT SELECT ON TABLE perfis, posts, comentarios, curtidas TO aluno_leitura;
GRANT SELECT ON vw_engajamento_posts, vw_engajamento_por_hora, vw_engajamento_por_dia_semana
    TO aluno_leitura;

-- Estas tabelas ficam de fora de propósito: token, gabarito, pausa e o diário dos agentes.
REVOKE ALL PRIVILEGES ON TABLE grupos FROM aluno_leitura;
REVOKE ALL PRIVILEGES ON TABLE gabarito_comentarios FROM aluno_leitura;
REVOKE ALL PRIVILEGES ON TABLE config FROM aluno_leitura;
REVOKE ALL PRIVILEGES ON TABLE acoes_agente FROM aluno_leitura;
