-- seed-nutrition.sql
-- Seed nutrition_config + nutrition_targets for both users.
-- Works in Supabase SQL editor (no psql meta-commands).
--
-- HOW TO USE:
--   1. Run: select id, email from auth.users;
--   2. Replace the two UUIDs below with the real ones.
--   3. Paste into the SQL editor and run.

-- ┌─────────────────────────────────────────────────────────┐
-- │  REPLACE THESE WITH YOUR ACTUAL AUTH UIDs               │
-- │  Person A = Arpit (recomp)                              │
-- │  Person B = Harshita (cut)                              │
-- └─────────────────────────────────────────────────────────┘
do $$
declare
  person_a uuid := 'be213280-323e-40f8-a6f5-3f6c1f84a92b';  -- Arpit (recomp)
  person_b uuid := 'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52';  -- Harshita (cut)
begin

  -- Person A (Arpit) — recomp
  insert into nutrition_config (
    user_id, goal_mode, trend_window_days, target_rate_kg_week,
    calorie_floor, protein_g_target, activity_multiplier
  ) values (
    person_a, 'recomp', 14, 0,
    2000, 140, 1.50
  ) on conflict (user_id) do update set
    goal_mode           = excluded.goal_mode,
    trend_window_days   = excluded.trend_window_days,
    target_rate_kg_week = excluded.target_rate_kg_week,
    calorie_floor       = excluded.calorie_floor,
    protein_g_target    = excluded.protein_g_target,
    activity_multiplier = excluded.activity_multiplier,
    updated_at          = now();

  insert into nutrition_targets (user_id, calories, protein_g, carbs_g, fat_g)
  values (person_a, 2400, 145, 309, 65)
  on conflict (user_id) do update set
    calories   = excluded.calories,
    protein_g  = excluded.protein_g,
    carbs_g    = excluded.carbs_g,
    fat_g      = excluded.fat_g,
    updated_at = now();

  insert into nutrition_target_history (
    user_id, calories, protein_g, carbs_g, fat_g, goal_mode, reason, source
  ) values (
    person_a, 2400, 145, 309, 65, 'recomp', 'seed', 'manual'
  );

  -- Person B (Harshita) — cut
  insert into nutrition_config (
    user_id, goal_mode, trend_window_days, target_rate_kg_week,
    calorie_floor, protein_g_target, activity_multiplier
  ) values (
    person_b, 'cut', 28, -0.6,
    1400, 125, 1.45
  ) on conflict (user_id) do update set
    goal_mode           = excluded.goal_mode,
    trend_window_days   = excluded.trend_window_days,
    target_rate_kg_week = excluded.target_rate_kg_week,
    calorie_floor       = excluded.calorie_floor,
    protein_g_target    = excluded.protein_g_target,
    activity_multiplier = excluded.activity_multiplier,
    updated_at          = now();

  insert into nutrition_targets (user_id, calories, protein_g, carbs_g, fat_g)
  values (person_b, 1600, 130, 157, 50)
  on conflict (user_id) do update set
    calories   = excluded.calories,
    protein_g  = excluded.protein_g,
    carbs_g    = excluded.carbs_g,
    fat_g      = excluded.fat_g,
    updated_at = now();

  insert into nutrition_target_history (
    user_id, calories, protein_g, carbs_g, fat_g, goal_mode, reason, source
  ) values (
    person_b, 1600, 130, 157, 50, 'cut', 'seed', 'manual'
  );

end $$;
