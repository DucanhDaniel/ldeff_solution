-- Write one SELECT (or WITH) query.
select employee_id, 
  CASE
    when answer_code is NULL then 'no answer'
    when answer_code = 'R' then 'remote'
    when answer_code = 'H' then 'hybrid'
    when answer_code = 'O' then 'office'
    else 'other'
  END as work_pattern
from survey_answers
