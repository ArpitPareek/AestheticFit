-- 025_ladder_metrics.sql
-- Person B's assist_reduction ladders (assisted-pull-up, incline-push-up):
-- the WIN is the assistance FALLING (kg) or the surface LOWERING toward the
-- floor as bodyweight drops — NOT more reps, and NOT overloading the weight_kg
-- field. Per-set values live in exercise_logs.sets jsonb (assist_kg /
-- surface_level, schemaless). These two denormalized columns store the SESSION's
-- best (lowest) ladder value so the falling-assistance TREND is cheap to chart
-- and query without parsing jsonb — the metric that tells B the cut is
-- retaining muscle.
--
-- Additive + reversible. To roll back:
--   alter table exercise_logs
--     drop column if exists ladder_assist_kg,
--     drop column if exists ladder_surface_level;

alter table exercise_logs
  add column if not exists ladder_assist_kg     numeric,   -- lowest machine/band assistance this session (0 = unassisted)
  add column if not exists ladder_surface_level smallint;  -- lowest incline surface this session (5=wall … 1=floor)
