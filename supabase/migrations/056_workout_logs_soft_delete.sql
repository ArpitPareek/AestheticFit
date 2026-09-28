-- 056_workout_logs_soft_delete.sql
-- B37-workout: undo on "Finish workout" needs a way to reverse the write
-- without a hard DELETE. Add `deleted_at` and make it invisible everywhere
-- reads happen (SELECT policy), while the actual undo is a soft one — an
-- UPDATE setting deleted_at = now(), covered by the existing "Users can
-- update recent workout logs" policy from 052 (same 1-day recency window;
-- undo fires within 5s of finish, well inside it).
--
-- A DELETE policy is added too so a genuinely bad row can still be purged
-- by the user later (e.g. via a future "delete workout" UI), independent of
-- the soft-delete undo path.
--
-- Idempotent.

alter table workout_logs
  add column if not exists deleted_at timestamptz;

drop policy if exists "Users can view own workout logs" on workout_logs;
create policy "Users can view own workout logs"
  on workout_logs for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "Users can delete own workout logs" on workout_logs;
create policy "Users can delete own workout logs"
  on workout_logs for delete to authenticated
  using (auth.uid() = user_id);

-- ── verification ─────────────────────────────────────────────────────────────
--   \d workout_logs                     -- deleted_at column present
--   select policyname, cmd from pg_policies where tablename = 'workout_logs';
--   -- as authed user: update workout_logs set deleted_at = now() where id = '<own recent id>';
--   -- then: select * from workout_logs where id = '<that id>'; -- 0 rows (SELECT hides it)
