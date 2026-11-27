-- Write one SELECT (or WITH) query.
select delivery_id, band
from deliveries d left join fee_bands
on distance_km >= min_km and (distance_km < max_km or max_km is NULL)
