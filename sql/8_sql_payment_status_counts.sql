-- Write one SELECT (or WITH) query.
select merchant_id, count(payment_id) as payments, 
  (select count(payment_id) from fct_payments tmp
    where tmp.merchant_id = f.merchant_id
    and status = 'captured') as captured,
  (select count(payment_id) from fct_payments tmp
    where tmp.merchant_id = f.merchant_id
    and status = 'refunded') as refunded
from fct_payments f
group by merchant_id
  
