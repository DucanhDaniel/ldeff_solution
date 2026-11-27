-- Write one SELECT (or WITH) query.
select p.payment_id, m.merchant_name, p.amount_cents
from 
  processor_payments p left join merchants m on cast(p.merchant_code as INTEGER) = cast(m.merchant_id as INTEGER) 
