-- 059_workout_logs_duration.sql
-- Explicit, user-correctable session duration in minutes.
--
-- WHY STORED EXPLICITLY (not derived from timestamps): started_at is stamped on
-- the FIRST set save and completed_at on Finish. Someone who logs all their sets
-- in a quick burst at the end of a real 60-minute session gets a timestamp delta
-- of seconds — the UI would show "1 min" for an hour of training. That delta is
-- known-bad as a duration, so we persist a separate value the user can set/correct.
--
-- Written at finish ONLY when the elapsed timestamp delta is plausible (>= 5 min);
-- otherwise left NULL for the user to fill in. LEGACY ROWS STAY NULL — there is no
-- backfill from timestamps, precisely because the timestamp delta is unreliable.
--
-- NOT wired into calorie estimation: estimateStrengthCalories is intentionally
-- duration-independent (plan-modeled sets×reps MET), so duration never affects it.
--
-- ROLLBACK:
--   ALTER TABLE workout_logs DROP COLUMN IF EXISTS duration_min;

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS duration_min int
    CHECK (duration_min IS NULL OR (duration_min >= 0 AND duration_min <= 600));
