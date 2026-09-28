-- 058_align_log_edit_window_to_picker.sql
-- Fixes a silent data bug: TodayWorkout's day picker lets you log/finish a session
-- for any of the LAST 7 DAYS, but migration 052 froze workout_logs / exercise_logs
-- UPDATE+DELETE to "today and yesterday" only. So finishing a session backdated
-- >1 day silently failed at the RLS layer — completed_at (and now calories) never
-- persisted, the streak never ticked, and finishWorkout showed a "complete" card
-- anyway because it never checks the write result. Sets still saved because INSERT
-- isn't date-restricted, which is exactly why it went unnoticed.
--
-- Resolution: widen the editable window to 7 days to MATCH the picker. Immutability
-- is preserved for its real purpose (a plan change must not rewrite far-past logs);
-- 7 days is still "recent" and is the exact range the UI already exposes. If the
-- picker range changes, change this window with it.
--
-- Idempotent — DROP POLICY IF EXISTS then CREATE.

-- ── workout_logs (finish = UPDATE completed_at/calories; undo = UPDATE deleted_at) ─
drop policy if exists "Users can update recent workout logs" on workout_logs;
create policy "Users can update recent workout logs"
  on workout_logs for update to authenticated
  using (
    auth.uid() = user_id
    and workout_date >= (current_date - interval '7 days')::date
  )
  with check (
    auth.uid() = user_id
    and workout_date >= (current_date - interval '7 days')::date
  );

-- ── exercise_logs (edit sets = UPDATE; undo/remove = DELETE), via parent's date ──
drop policy if exists "Users can update recent exercise logs" on exercise_logs;
create policy "Users can update recent exercise logs"
  on exercise_logs for update to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from workout_logs w
       where w.id = exercise_logs.workout_log_id
         and w.workout_date >= (current_date - interval '7 days')::date
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from workout_logs w
       where w.id = exercise_logs.workout_log_id
         and w.workout_date >= (current_date - interval '7 days')::date
    )
  );

drop policy if exists "Users can delete recent exercise logs" on exercise_logs;
create policy "Users can delete recent exercise logs"
  on exercise_logs for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from workout_logs w
       where w.id = exercise_logs.workout_log_id
         and w.workout_date >= (current_date - interval '7 days')::date
    )
  );
