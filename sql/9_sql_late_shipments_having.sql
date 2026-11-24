-- Write one SELECT (or WITH) query.
with tbl as (
  select shipment_id, warehouse_id, 
    CASE
      when promised_date < delivered_date then 1
      else 0
    END as is_late
  from shipments
),
cnt_late as (
  select warehouse_id, sum(is_late) as late_shipments, count(is_late) as total_shipments
  from tbl
  group by warehouse_id
)

select * from cnt_late
where late_shipments > 3
