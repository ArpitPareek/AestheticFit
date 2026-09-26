-- Migration 034: richer cardio logging
-- Adds MET-based calorie estimation + distance/pace + perceived effort to
-- cardio_logs. All nullable so existing rows and the old form keep working.
--
-- ROLLBACK:
--   ALTER TABLE cardio_logs
--     DROP COLUMN IF EXISTS activity_key,
--     DROP COLUMN IF EXISTS distance_km,
--     DROP COLUMN IF EXISTS calories,
--     DROP COLUMN IF EXISTS calories_source,
--     DROP COLUMN IF EXISTS rpe;

ALTER TABLE cardio_logs
  -- library activity key (e.g. 'cricket', 'incline_walk'); null for a custom type
  ADD COLUMN IF NOT EXISTS activity_key    text,
  ADD COLUMN IF NOT EXISTS distance_km     numeric(6,2) CHECK (distance_km IS NULL OR distance_km >= 0),
  ADD COLUMN IF NOT EXISTS calories        int CHECK (calories IS NULL OR calories >= 0),
  -- 'estimated' = MET formula, 'measured' = user typed a device number
  ADD COLUMN IF NOT EXISTS calories_source text CHECK (calories_source IN ('estimated','measured')),
  ADD COLUMN IF NOT EXISTS rpe             int CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10));
