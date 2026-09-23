-- Migration 031: Align nutrition_config + nutrition_targets with coach intent
--
-- Fixes:
--   A: config protein_g_target 140 → 145 (matches nutrition_targets.protein_g)
--   B: config protein_g_target 125 → 130, calorie_floor 1400 → 1200
--   B: targets calories 1600 → 1300, recomputed macros (130P/105C/40F)
--
-- ROLLBACK:
--   UPDATE nutrition_config SET protein_g_target = 140, updated_at = now()
--     WHERE user_id = 'be213280-323e-40f8-a6f5-3f6c1f84a92b';
--   UPDATE nutrition_config SET protein_g_target = 125, calorie_floor = 1400, updated_at = now()
--     WHERE user_id = 'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52';
--   UPDATE nutrition_targets SET calories = 1600, carbs_g = 157, fat_g = 50, updated_at = now()
--     WHERE user_id = 'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52';

do $$
declare
  person_a uuid := 'be213280-323e-40f8-a6f5-3f6c1f84a92b';
  person_b uuid := 'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52';
begin
  -- Person A: align config protein floor with targets
  UPDATE nutrition_config
    SET protein_g_target = 145, updated_at = now()
    WHERE user_id = person_a;

  -- Person B: correct config protein floor + lower calorie floor below new target
  UPDATE nutrition_config
    SET protein_g_target = 130,
        calorie_floor    = 1200,
        updated_at       = now()
    WHERE user_id = person_b;

  -- Person B: coach-intended targets (1300 kcal, 130P/105C/40F)
  UPDATE nutrition_targets
    SET calories   = 1300,
        protein_g  = 130,
        carbs_g    = 105,
        fat_g      = 40,
        updated_at = now()
    WHERE user_id = person_b;

  -- Audit trail
  INSERT INTO nutrition_target_history
    (user_id, calories, protein_g, carbs_g, fat_g, goal_mode, reason, source)
  VALUES
    (person_b, 1300, 130, 105, 40, 'cut', 'coach correction: 1600→1300 kcal', 'manual');
end $$;
