-- Write one SELECT (or WITH) query.
with filtered_tbl as (
  select ticket_id, subject, merged_into 
  from helpdesk_tickets h 
  where merged_into is not NULL
)

select h1.ticket_id as ticket_id, h2.subject as parent_subject
from filtered_tbl h1 left join helpdesk_tickets h2 
on h1.merged_into = h2.ticket_id
