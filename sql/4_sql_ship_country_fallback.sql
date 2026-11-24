-- Write one SELECT (or WITH) query.
-- select * from orders
with joined_tbl as (
  select o.order_id, 
    CASE 
      WHEN o.ship_country like ' %' THEN NULL
      WHEN o.ship_country is NULL THEN NULL
      ELSE o.ship_country
    END as ship_country,
    CASE 
      WHEN a.country like ' %' THEN NULL
      WHEN a.country is NULL THEN NULL
      ELSE a.country
    END as account_country
  from orders o left join accounts a on o.account_id = a.account_id
)
-- select * from joined_tbl
select order_id, COALESCE(ship_country, account_country, 'unknown') as ship_country
from joined_tbl
