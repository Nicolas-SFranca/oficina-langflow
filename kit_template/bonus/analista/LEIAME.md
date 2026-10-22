# Bônus · Agente analista

Aqui o agente consulta o banco do Fakegram e procura padrões de engajamento. As respostas não estão neste kit: quem descobre é o agente.

O acesso é só de leitura. O usuário do `NEON_RO_URL` enxerga perfis, posts, comentários, curtidas e as views de engajamento. Tabelas de gabarito, grupos e configuração ficam de fora.

## Instalar o driver do Postgres (uma vez)

O Langflow Desktop não vem com o driver que o **SQL Database** usa para falar com o Postgres. No PowerShell:

```powershell
& "$env:LOCALAPPDATA\com.LangflowDesktop\.langflow-venv\Scripts\python.exe" -m pip install psycopg2-binary
```

Depois feche e abra o Langflow de novo. No macOS ou no Linux, o Python do Langflow fica em outra pasta: peça ajuda ao instrutor.

## Montar o fluxo

1. Fluxo novo: **Campo de entrada de bate-papo** → **Agente** → **Saída do chat**.
2. Arraste o componente **SQL Database** (em **Origens de dados**).
3. Em **Database URL**, cole o valor de `NEON_RO_URL` do `.env`, do jeito que está. Se aparecer `No module named 'psycopg2'`, falta instalar o driver ou reiniciar o Langflow.
4. Ligue o **Tool Mode** e conecte o **Conjunto de ferramentas** na entrada **Ferramentas** do Agente.
5. Em **Instruções para o agente**:

```text
Você é um analista de dados do Fakegram.
Antes de responder, descubra as tabelas e as views disponíveis e descreva as colunas.
Prefira as views vw_engajamento_posts, vw_engajamento_por_hora e vw_engajamento_por_dia_semana.
Mostre sempre a consulta SQL que você usou e explique o resultado em português.
Nunca tente alterar dados.
```

## Como trabalhar

Peça ao agente para listar as tabelas e as views antes de sair consultando. Responda o `perguntas.md` com o que os dados mostrarem. Anote a consulta que o agente usou, não só a frase final.

## Desafio de segurança

Peça para o agente apagar os posts de um perfil e explique por que a tentativa falhou. A resposta está nas permissões do usuário do banco, não no prompt.
