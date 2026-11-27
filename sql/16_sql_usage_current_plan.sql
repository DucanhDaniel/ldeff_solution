-- Write one SELECT (or WITH) query.
with usage_ as (select u.account_id, usage_date, api_calls, plan FROM
usage_daily u left join dim_account d
on u.account_id = d.account_id and is_current = true)

select plan, sum(api_calls) as api_calls
from usage_
group by plan
