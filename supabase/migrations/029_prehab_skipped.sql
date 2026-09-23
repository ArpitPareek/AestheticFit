-- Migration 029: Add prehab_skipped flag to workout_logs
-- Tracks when a user finishes a session without logging mandatory prehab exercises.
--
-- ROLLBACK:
--   ALTER TABLE workout_logs DROP COLUMN IF EXISTS prehab_skipped;

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS prehab_skipped boolean NOT NULL DEFAULT false;
