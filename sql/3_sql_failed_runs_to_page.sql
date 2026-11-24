-- Write one SELECT (or WITH) query.
select run_id, pipeline, started_at
from pipeline_runs
where status = 'failed' and is_retry = 'false' and triggered_by != 'backfill-bot' and triggered_by is not NULL 
UNION
select run_id, pipeline, started_at
from pipeline_runs
where status = 'failed' and triggered_by is NULL and is_retry = 'false'
