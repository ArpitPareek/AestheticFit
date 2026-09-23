-- 035_date_repair.sql
-- One-time repair for rows logged between 00:00–05:30 IST that were stored with
-- the wrong (UTC-derived) log_date instead of the correct IST date.
--
-- INSTRUCTIONS — run in two steps:
--   STEP 1: Run the SELECT block below to count affected rows.
--           Review the counts. If they look sane (small numbers), proceed.
--   STEP 2: Run the UPDATE block below (inside BEGIN/COMMIT).
--           Re-running STEP 2 is safe — the WHERE clause is self-quenching.
--
-- The condition: log_date = UTC date AND log_date ≠ IST date.
-- This means the stored date matches what toISOString() would have returned
-- but differs from the correct IST calendar date. Rows already correct (or
-- manually set to a different past date) are untouched.

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1 — Preview (run this first; confirm counts before proceeding)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

select 'meal_logs'  as table_name, count(*) as affected_rows
from   meal_logs
where  log_date = (created_at at time zone 'utc')::date
  and  log_date != (created_at at time zone 'Asia/Kolkata')::date

union all

select 'daily_logs', count(*)
from   daily_logs
where  log_date = (created_at at time zone 'utc')::date
  and  log_date != (created_at at time zone 'Asia/Kolkata')::date

union all

select 'cardio_logs', count(*)
from   cardio_logs
where  log_date = (created_at at time zone 'utc')::date
  and  log_date != (created_at at time zone 'Asia/Kolkata')::date

union all

select 'weight_logs', count(*)
from   weight_logs
where  log_date = (created_at at time zone 'utc')::date
  and  log_date != (created_at at time zone 'Asia/Kolkata')::date;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2 — Update (only run after confirming counts above are sane)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

begin;

update meal_logs
   set log_date = (created_at at time zone 'Asia/Kolkata')::date
 where log_date  = (created_at at time zone 'utc')::date
   and log_date != (created_at at time zone 'Asia/Kolkata')::date;

update daily_logs
   set log_date = (created_at at time zone 'Asia/Kolkata')::date
 where log_date  = (created_at at time zone 'utc')::date
   and log_date != (created_at at time zone 'Asia/Kolkata')::date;

update cardio_logs
   set log_date = (created_at at time zone 'Asia/Kolkata')::date
 where log_date  = (created_at at time zone 'utc')::date
   and log_date != (created_at at time zone 'Asia/Kolkata')::date;

update weight_logs
   set log_date = (created_at at time zone 'Asia/Kolkata')::date
 where log_date  = (created_at at time zone 'utc')::date
   and log_date != (created_at at time zone 'Asia/Kolkata')::date;

commit;
