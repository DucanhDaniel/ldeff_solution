-- Write one SELECT (or WITH) query.
with product_cr as (
  select product_id, category,100.0 * orders / views as conversion_pct
  from product_month_stats
)
select product_id, category, round(conversion_pct, 1) as conversion_pct, rank() over (partition by category order by conversion_pct desc) as conversion_rank from product_cr
