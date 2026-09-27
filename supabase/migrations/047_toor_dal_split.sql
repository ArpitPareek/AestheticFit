-- 047_toor_dal_split.sql
-- Batch 0 / B02: `toor-dal` is a colliding id — seed-food-staples.sql seeds it
-- as DRY (343 kcal/100 g) while seed-foods.sql seeds the SAME id as COOKED
-- (150 kcal / 200 g katori). Whichever seed ran last wins, and today "1 katori
-- dal" is being logged as ~514 kcal instead of ~158.
--
-- Fix: keep `toor-dal` as the cooked bowl (this is what portion_conversions and
-- the parser aliases already assume — katori=150 g, plate=200 g), and split off
-- a new `toor-dal-raw` row that holds the dry macros.
--
-- Idempotent + safe to re-run. FK behavior:
--   * portion_conversions.food_id ON DELETE CASCADE — we don't delete `toor-dal`
--   * food_aliases.food_id        ON DELETE CASCADE — same
--   * meal_logs.food_id           ON DELETE SET NULL — past meal_logs snapshot
--     their macros in columns (see 008_meal_logs.sql + 015), so history is
--     frozen regardless of what happens to food_library rows.

-- 1. Ensure the dry row exists under its own id (does not clobber if already there).
insert into food_library
  (id, name, aliases, category, is_vegetarian, serving_size, serving_grams,
   calories, protein_g, carbs_g, fat_g, fiber_g, source)
values
  ('toor-dal-raw', 'Toor dal (dry)',
   ARRAY['toor dal dry','arhar dal dry','tur dal dry','red gram dal','pigeon pea dry','raw toor dal']::text[],
   'Grain Legumes', true, '100 g dry', 100, 343, 22, 63, 1.5, 15, 'manual')
on conflict (id) do update set
  name          = excluded.name,
  aliases       = excluded.aliases,
  category      = excluded.category,
  serving_size  = excluded.serving_size,
  serving_grams = excluded.serving_grams,
  calories      = excluded.calories,
  protein_g     = excluded.protein_g,
  carbs_g       = excluded.carbs_g,
  fat_g         = excluded.fat_g,
  fiber_g       = excluded.fiber_g,
  source        = excluded.source;

-- 2. Force `toor-dal` back to the cooked bowl values (undoes whatever the last
-- seed run left, if it was the dry values).
update food_library set
  name          = 'Toor Dal',
  aliases       = ARRAY['arhar dal','pigeon pea dal','tur dal','toor dal','arhar','dal','daal','dhal']::text[],
  category      = 'dal',
  is_vegetarian = true,
  serving_size  = '1 bowl (200ml)',
  serving_grams = 200,
  calories      = 150,
  protein_g     = 10,
  carbs_g       = 24,
  fat_g         = 1,
  fiber_g       = 5,
  source        = 'ifct'
where id = 'toor-dal';

-- If someone deleted `toor-dal` at some point, put the cooked row back.
insert into food_library
  (id, name, aliases, category, is_vegetarian, serving_size, serving_grams,
   calories, protein_g, carbs_g, fat_g, fiber_g, source)
values
  ('toor-dal', 'Toor Dal',
   ARRAY['arhar dal','pigeon pea dal','tur dal','toor dal','arhar','dal','daal','dhal']::text[],
   'dal', true, '1 bowl (200ml)', 200, 150, 10, 24, 1, 5, 'ifct')
on conflict (id) do nothing;

-- 3. Repoint dry-specific aliases in food_aliases to the new dry row.
insert into food_aliases (alias_text, food_id)
values
  ('toor dal dry',    'toor-dal-raw'),
  ('arhar dal dry',   'toor-dal-raw'),
  ('tur dal dry',     'toor-dal-raw'),
  ('raw toor dal',    'toor-dal-raw'),
  ('uncooked toor dal','toor-dal-raw'),
  ('pigeon pea',      'toor-dal-raw')
on conflict (alias_text, food_id) do nothing;

-- Cooked aliases (idempotent — these may already exist from 041_food_data.sql).
insert into food_aliases (alias_text, food_id)
values
  ('dal',        'toor-dal'),
  ('daal',       'toor-dal'),
  ('dhal',       'toor-dal'),
  ('arhar',      'toor-dal'),
  ('arhar dal',  'toor-dal'),
  ('toor dal',   'toor-dal'),
  ('tur dal',    'toor-dal')
on conflict (alias_text, food_id) do nothing;

-- 4. portion_conversions on 'toor-dal' were seeded as COOKED (katori=150,
-- plate=200). Leave them alone. Add a dry conversion for calibration.
insert into portion_conversions (food_id, unit, grams_equivalent)
values ('toor-dal-raw', 'cup', 200)
on conflict (food_id, unit) do nothing;

-- ── verification (run these SELECTs by hand in the SQL editor) ───────────────
--   select id, name, serving_size, serving_grams, calories, protein_g
--     from food_library where id in ('toor-dal','toor-dal-raw') order by id;
--   -- expect: toor-dal 200 g / 150 kcal, toor-dal-raw 100 g / 343 kcal
--
--   select alias_text, food_id from food_aliases
--    where food_id in ('toor-dal','toor-dal-raw') order by food_id, alias_text;
--
--   select food_id, unit, grams_equivalent from portion_conversions
--    where food_id in ('toor-dal','toor-dal-raw') order by food_id, unit;
