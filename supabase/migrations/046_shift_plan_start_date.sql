-- 046_shift_plan_start_date.sql
-- Shifts Phase-1 start_date from 2026-09-24 to 2026-09-28 for both users.
-- Run in Supabase SQL Editor.

update workout_plans
   set start_date = date '2026-09-28'
 where plan_source = 'coach_authored'
   and phase = 1
   and start_date = date '2026-09-24'
   and user_id in ('be213280-323e-40f8-a6f5-3f6c1f84a92b'::uuid,
                   'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52'::uuid);

-- Verify: expect 2 rows with start_date 2026-09-28
select user_id, plan_name, phase, start_date
  from workout_plans
 where plan_source = 'coach_authored'
   and phase = 1
   and user_id in ('be213280-323e-40f8-a6f5-3f6c1f84a92b'::uuid,
                   'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52'::uuid);
