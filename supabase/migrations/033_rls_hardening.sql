-- 033_rls_hardening.sql
-- Belt-and-suspenders: ensures RLS is active on every app table.
-- All ALTER TABLE ... ENABLE ROW LEVEL SECURITY calls are idempotent (safe no-op
-- when already on). Does NOT add DELETE policies where immutability is intentional.
-- Does NOT modify or drop any working policy.
--
-- After running: paste scripts/check-rls.sql into the SQL editor → expect 0 rows.

-- ── User-owned data tables ──────────────────────────────────────────────────
alter table profiles                 enable row level security;
alter table assessments              enable row level security;
alter table workout_plans            enable row level security;
alter table workout_logs             enable row level security;
alter table exercise_logs            enable row level security;
alter table meal_logs                enable row level security;
alter table weight_logs              enable row level security;
alter table skin_logs                enable row level security;
alter table skin_checkins            enable row level security;
alter table daily_logs               enable row level security;
alter table streaks                  enable row level security;
alter table cardio_logs              enable row level security;
alter table nutrition_config         enable row level security;
alter table tdee_estimates           enable row level security;
alter table nutrition_targets        enable row level security;
alter table nutrition_target_history enable row level security;
alter table progress_photos          enable row level security;
alter table custom_foods             enable row level security;
alter table recipe_ingredients       enable row level security;
alter table custom_exercises         enable row level security;

-- ── Shared reference tables (service-role writes; anon/authed read-only) ───
alter table exercise_library         enable row level security;
alter table food_library             enable row level security;
