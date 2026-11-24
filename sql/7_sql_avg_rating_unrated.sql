-- Write one SELECT (or WITH) query.
with tbl as (
  select agent_id, ticket_id, score from csat_responses
  where score is not NULL
)

-- with tbl2 as (
--   select agent_id from csat_responses
--   where score
-- )

-- select * from csat_responses
select agent_id, 
  CASE
    when avg(score) is null then 0
    else count(score)
  end as rated_tickets,
  round(AVG(score), 2) as avg_score
from csat_responses
group by agent_id
