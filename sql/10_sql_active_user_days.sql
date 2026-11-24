-- Write one SELECT (or WITH) query.
with tbl as (select workspace_id, concat(to_char(event_at, 'yyyymmdd'), user_id) ud_id 
from app_events)

select workspace_id, count(distinct ud_id) as active_user_days
from tbl
group by workspace_id
