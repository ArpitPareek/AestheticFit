-- 040_indexes.sql
-- Indexes on hot-path queries: every table's primary access pattern is
-- (user_id, date/timestamp) DESC. All created IF NOT EXISTS so the migration
-- is safe to re-run.
--
-- ROLLBACK:
--   drop index if exists exercise_logs_user_created_idx;
--   drop index if exists weight_logs_user_date_idx;
--   drop index if exists skin_logs_user_date_idx;
--   drop index if exists cardio_logs_user_date_idx;
--   (meal_logs indexes were added in 036 — leave those)

-- Exercise logs: history queries filter by user, order by created_at DESC
create index if not exists exercise_logs_user_created_idx
  on exercise_logs (user_id, created_at desc);

-- Weight logs: chart + streaks query by (user_id, log_date)
create index if not exists weight_logs_user_date_idx
  on weight_logs (user_id, log_date);

-- Skin logs: per-day lookup and streak calculation
create index if not exists skin_logs_user_date_idx
  on skin_logs (user_id, log_date);

-- Cardio logs: week-range query by (user_id, session_date)
create index if not exists cardio_logs_user_date_idx
  on cardio_logs (user_id, session_date);
