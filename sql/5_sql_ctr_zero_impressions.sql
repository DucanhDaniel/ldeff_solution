-- Write one SELECT (or WITH) query.
select ad_id, impressions, clicks, 
  CASE
    when impressions = 0 then NULL
    when clicks = 0 then 0
    else round(1.0 * clicks / impressions, 4)
  end as ctr
from fct_ad_stats
