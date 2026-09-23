-- 024_coach_go_live.sql
-- STEP 7 "go live": make each user's coach Phase 1 the single active plan.
-- Deactivates whatever plan is currently active for the user and activates their
-- coach_authored phase-1 row. The user's other plans (generated + dormant coach
-- phases 2-4) are preserved, just is_active=false.
--
-- SAFE + IDEMPOTENT:
--  * The deactivate step only fires if a coach Phase 1 actually EXISTS for that
--    user (the `exists (...)` guard), so a missing/failed 023 can never leave a
--    user with zero active plans.
--  * Re-running is a no-op (coach P1 already active, everything else inactive).
--  * No apostrophes or semicolons inside any string literal -> safe even if run
--    through a tool that naively splits on ';'. Still best run whole in the
--    Supabase SQL Editor.

-- ── Phase-1 start date = 24 Sep 2026 ──
update workout_plans
   set start_date = date '2026-09-24'
 where plan_source = 'coach_authored'
   and phase = 1
   and user_id in ('be213280-323e-40f8-a6f5-3f6c1f84a92b'::uuid,
                   'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52'::uuid);

-- ── Person A (recomp) — be213280-323e-40f8-a6f5-3f6c1f84a92b ──
update workout_plans w
   set is_active = false
 where w.user_id = 'be213280-323e-40f8-a6f5-3f6c1f84a92b'::uuid
   and w.is_active = true
   and not (w.plan_source = 'coach_authored' and w.phase = 1)
   and exists (
     select 1 from workout_plans c
      where c.user_id = w.user_id and c.plan_source = 'coach_authored' and c.phase = 1
   );

update workout_plans
   set is_active = true
 where user_id = 'be213280-323e-40f8-a6f5-3f6c1f84a92b'::uuid
   and plan_source = 'coach_authored'
   and phase = 1;

-- ── Person B (cut) — be5d8bf5-ca0f-4897-8d41-62b2d2c72b52 ──
update workout_plans w
   set is_active = false
 where w.user_id = 'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52'::uuid
   and w.is_active = true
   and not (w.plan_source = 'coach_authored' and w.phase = 1)
   and exists (
     select 1 from workout_plans c
      where c.user_id = w.user_id and c.plan_source = 'coach_authored' and c.phase = 1
   );

update workout_plans
   set is_active = true
 where user_id = 'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52'::uuid
   and plan_source = 'coach_authored'
   and phase = 1;


-- ─────────────────────────── VERIFICATION ───────────────────────────
-- Run these two selects after the updates above.

-- (V1) Exactly ONE active plan per user, and it is the coach Phase 1.
-- Expect: 2 rows, active_count = 1 each, plan_name = 'Coach: ...', phase = 1,
-- start_date = 2026-09-24.
select user_id,
       count(*)                                   as active_count,
       max(plan_name)                             as active_plan,
       max(phase)                                 as phase,
       max(plan_source)                           as plan_source,
       max(start_date)                            as start_date
  from workout_plans
 where is_active = true
   and user_id in ('be213280-323e-40f8-a6f5-3f6c1f84a92b'::uuid,
                   'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52'::uuid)
 group by user_id;

-- (V2) Every ref + alternative id across ALL 8 coach plans resolves in
-- exercise_library. Expect: 0 rows.
with coach_ids as (
  select distinct e -> 'ref' ->> 'id' as id
    from workout_plans wp,
         lateral jsonb_array_elements(wp.plan_data -> 'days')      d,
         lateral jsonb_array_elements(d -> 'exercises')            e
   where wp.plan_source = 'coach_authored'
  union
  select distinct alt ->> 'id' as id
    from workout_plans wp,
         lateral jsonb_array_elements(wp.plan_data -> 'days')      d,
         lateral jsonb_array_elements(d -> 'exercises')            e,
         lateral jsonb_array_elements(e -> 'alternatives')         alt
   where wp.plan_source = 'coach_authored'
)
select c.id as unresolved_exercise_id
  from coach_ids c
  left join exercise_library el on el.id = c.id
 where el.id is null;
