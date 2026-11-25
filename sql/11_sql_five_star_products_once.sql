-- Write one SELECT (or WITH) query.
select distinct r.product_id, p.product_name
from reviews r left join products p on r.product_id = p.product_id
where rating = 5
