-- 057_workout_logs_calories.sql
-- Strength-session calorie ESTIMATE (plan-modeled sets×reps MET, computed client-
-- side at finish — see src/features/workout/strengthCalories.ts).
--
-- Display / motivational ONLY. Deliberately NOT fed into nutrition_targets: those
-- are set by the adaptive TDEE engine (adjust-nutrition-targets), which infers
-- TOTAL expenditure from intake-vs-weight-trend and therefore already captures all
-- training. Adding this back would double-count the workout. Both columns are
-- nullable so existing rows and the current write path are unaffected.
--
-- Mirrors cardio_logs' calories / calories_source shape (migration 044).
--
-- ROLLBACK:
--   ALTER TABLE workout_logs
--     DROP COLUMN IF EXISTS calories,
--     DROP COLUMN IF EXISTS calories_source;

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS calories        int
    CHECK (calories IS NULL OR calories >= 0),
  -- 'estimated' = plan-modeled MET at finish; 'measured' reserved for a future
  -- HR/device import, matching cardio_logs.calories_source semantics.
  ADD COLUMN IF NOT EXISTS calories_source text
    CHECK (calories_source IN ('estimated','measured'));
