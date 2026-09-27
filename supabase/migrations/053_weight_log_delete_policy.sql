-- 053_weight_log_delete_policy.sql
-- Batch 0 / MEDIUM: `weight_logs` has view/insert/update policies (see
-- 009_weight_logs.sql) but no DELETE policy — the UI can never let a user
-- remove a mistyped weigh-in, and Batch 5's "undo last weight" toast has
-- nothing to call.
--
-- Add a DELETE policy scoped to `user_id = auth.uid()`. Keep it unconstrained
-- by date: users legitimately need to delete old bad entries when they clean
-- up their chart (rare, but the whole point of undo is user trust).
--
-- Idempotent.

drop policy if exists "Users can delete own weight logs" on weight_logs;
create policy "Users can delete own weight logs"
  on weight_logs for delete to authenticated
  using (auth.uid() = user_id);

-- ── verification ─────────────────────────────────────────────────────────────
--   select policyname, cmd from pg_policies
--    where tablename = 'weight_logs' order by cmd;
--   -- expect: SELECT, INSERT, UPDATE, DELETE  (4 policies)
