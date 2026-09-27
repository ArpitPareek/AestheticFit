-- 052_historical_log_immutability.sql
-- Batch 0 / B11: 006_exercise_logs.sql and 005_workout_logs.sql both grant an
-- unconditional UPDATE policy — a user can rewrite ANY of their past logs.
-- CLAUDE.md says: "Historical logs are immutable — changing a plan doesn't
-- alter past workout logs." Enforce that at the RLS layer.
--
-- Also add `plan_version_id uuid references workout_plans(id)` to workout_logs
-- (already present on exercise_logs since 015) so we can answer "which plan
-- version was active when this session ran" — the current hardcoded `1` in
-- useWorkoutLogger.ts:106 is the app-level bug Batch 4 will fix.
--
-- The immutability window is "today and yesterday" — a user finishing a
-- session at 23:59 IST that spills past midnight (or fixing a mistyped RIR
-- the next morning) still needs to edit. Anything older than yesterday's
-- workout_date is frozen.
--
-- Idempotent — DROP POLICY IF EXISTS then CREATE.

-- ── workout_logs ─────────────────────────────────────────────────────────────
alter table workout_logs
  add column if not exists plan_version_id uuid references workout_plans(id) on delete set null;

drop policy if exists "Users can update own workout logs" on workout_logs;
create policy "Users can update recent workout logs"
  on workout_logs for update to authenticated
  using (
    auth.uid() = user_id
    and workout_date >= (current_date - interval '1 day')::date
  )
  with check (
    auth.uid() = user_id
    and workout_date >= (current_date - interval '1 day')::date
  );

-- ── exercise_logs ────────────────────────────────────────────────────────────
-- Exercise logs are joined to workout_logs; enforce immutability via the parent
-- session's workout_date (that's the semantically correct "when").
drop policy if exists "Users can update own exercise logs" on exercise_logs;
create policy "Users can update recent exercise logs"
  on exercise_logs for update to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from workout_logs w
       where w.id = exercise_logs.workout_log_id
         and w.workout_date >= (current_date - interval '1 day')::date
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from workout_logs w
       where w.id = exercise_logs.workout_log_id
         and w.workout_date >= (current_date - interval '1 day')::date
    )
  );

-- Same story for DELETE on exercise_logs (undo). Keep 2-day window symmetric.
drop policy if exists "Users can delete own exercise logs" on exercise_logs;
create policy "Users can delete recent exercise logs"
  on exercise_logs for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from workout_logs w
       where w.id = exercise_logs.workout_log_id
         and w.workout_date >= (current_date - interval '1 day')::date
    )
  );

-- ── verification ─────────────────────────────────────────────────────────────
--   -- Attempting to update an old workout_log should fail:
--   -- (as an authed user)
--   -- update workout_logs set notes = 'x' where workout_date < current_date - 30;
--   -- returns 0 rows or RLS violation
--
--   \d workout_logs                     -- plan_version_id column present
--   select policyname, cmd from pg_policies
--    where tablename in ('workout_logs','exercise_logs') order by tablename, cmd;
