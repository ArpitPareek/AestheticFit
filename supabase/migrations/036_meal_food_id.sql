-- 036_meal_food_id.sql
-- meal_logs.food_id already exists (nullable FK → food_library).
-- This migration adds the hot-path indexes that were missing.
-- Backfill of historical nulls is deferred until after the food reseed (F1).
--
-- ROLLBACK:
--   drop index if exists meal_logs_user_date_idx;
--   drop index if exists meal_logs_food_id_idx;

create index if not exists meal_logs_user_date_idx
  on meal_logs (user_id, log_date);

create index if not exists meal_logs_food_id_idx
  on meal_logs (food_id)
  where food_id is not null;
