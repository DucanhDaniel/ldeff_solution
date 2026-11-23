-- Write one SELECT (or WITH) query.
select count(*) as signups, count(referral_code) as with_code, count(DISTINCT referral_code) as codes
from signups