-- Write one SELECT (or WITH) query.
with active_warehouse as (
  select warehouse_id, city
  from dim_warehouse
  where is_active = true
), cnt_shipments as (
select i.warehouse_id, count(shipment_id)  as received_shipments
from inbound_shipments i
where status = 'received'
group by i.warehouse_id)

select a.warehouse_id, a.city, COALESCE(c.received_shipments, 0) as received_shipments
from  active_warehouse a left join cnt_shipments c on a.warehouse_id =  c.warehouse_id
