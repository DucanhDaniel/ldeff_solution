-- Write one SELECT (or WITH) query.
with tbl as (
  select reading_id, gateway_id, device_id, DATE_PART('minute', reported_at) as minutes, concat(to_char(reported_at, 'YYYY-MM-DD-HH24-mi'), gateway_id) as connection_id
  from readings
),
tbl2 as (
  select tbl1.gateway_id, tbl1.device_id as device_a, tbl2.device_id as device_b, tbl1.minutes as shared_minutes
  from tbl tbl1 inner join tbl tbl2 on tbl1.device_id < tbl2.device_id and tbl1.connection_id = tbl2.connection_id 
)

select tbl2.gateway_id, tbl2.device_a, tbl2.device_b, count(shared_minutes) as shared_minutes from tbl2
group by gateway_id, device_a, device_b
