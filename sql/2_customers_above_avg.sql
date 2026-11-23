
-- Write one SELECT (or WITH) query.
with
  temp1 AS (
    select
      customer_id,
      sum(amount) as total_spend
    from
      orders
    group by
      customer_id
  ),
  temp2 as (
    select
      avg(total_spend) as avg_spend
    from
      temp1
  )
select
  temp1.customer_id,
  temp1.total_spend
from
  temp1, temp2 
where temp1.total_spend > temp2.avg_spend
order by temp1.total_spend desc