# Descobertas do exercício 2

Documento do instrutor. Os alunos não precisam deste arquivo: a ideia é que o agente leia o banco e encontre os padrões abaixo.

Os horários e os dias usam o fuso de Brasília, o mesmo das views `vw_engajamento_por_hora` e `vw_engajamento_por_dia_semana`. O seed usa `random.seed(42)`, então as proporções se repetem. A data exata muda porque a janela são os últimos 60 dias a partir do momento em que o script rodou.

## Padrões

- Posts publicados às 18h, 19h, 20h ou 21h recebem cerca de 2 vezes mais curtidas do que os outros horários.
- Terça e quinta são os dias com mais curtidas por post (cerca de 1,8 vez a média dos outros dias).
- Legenda com ponto de interrogação recebe cerca de 40% mais comentários.
- Post com mais de 8 hashtags recebe cerca de 30% menos curtidas.
- @smashdaesquina tem um pico de reclamações de atraso de entrega nos posts publicados de 21 a 27 dias antes do seed. O texto fala em atraso, entrega e pedido frio. O tipo `reclamacao` está só em `gabarito_comentarios`, que o usuário `aluno_leitura` não consegue ler.

## Como conferir

```sql
SELECT * FROM vw_engajamento_por_hora ORDER BY hora;
SELECT * FROM vw_engajamento_por_dia_semana ORDER BY media_curtidas DESC;
SELECT tem_pergunta, round(avg(comentarios), 2) FROM vw_engajamento_posts GROUP BY tem_pergunta;
SELECT qtd_hashtags > 8 AS muitas, round(avg(curtidas), 2) FROM vw_engajamento_posts GROUP BY 1;
```

Cada perfil começa a aula com 5 a 8 comentários das últimas 24 horas ainda sem resposta, entre eles ao menos um spam e uma dúvida.
