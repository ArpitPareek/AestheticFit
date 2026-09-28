-- 061_mill_protein_roti.sql
-- Adds Arpit's occasional "mill protein atta roti" — a roti made from a custom
-- protein/multigrain atta blend ground at the local flour mill (chakki). Higher
-- protein + fiber than a plain wheat roti, so it deserves its own food_library
-- row rather than resolving to 'roti' / 'multigrain-roti' and under-counting
-- protein.
--
-- Resolution: parse-meal matches free text against food_library.name, the
-- embedded aliases[] array, and the food_aliases table (via match_food_fuzzy).
-- The aliases below cover the phrasings the AI is likely to emit ("mill roti",
-- "protein roti", "protein atta roti", "chakki atta roti", …).
--
-- MACRO BASIS (per Arpit's instruction): assume the atta is 30 g protein per
-- 100 g of flour. One roti ≈ 40 g of atta, so protein = 30% × 40 = 12 g/roti.
-- The remaining macros use a high-protein atta profile per 100 g flour
-- (protein 30, carbs 48, fat 4, fiber 10, ≈ 345 kcal), scaled to the 40 g roti:
--   calories 140, protein 12, carbs 19, fat 1.6, fiber 4.
-- NOTE: 30 g/100 g is far above the mill's own claim (~4 g/100 g) and above
-- typical high-protein attas (~14–20 g/100 g). If it over-counts your daily
-- protein, lower protein_g here and re-run — the insert is idempotent.
--
-- Run the whole file in the Supabase SQL editor (paste + Run).

-- ── food_library row ─────────────────────────────────────────────────────────
insert into food_library
  (id, name, aliases, category, is_vegetarian, serving_size, serving_grams,
   calories, protein_g, carbs_g, fat_g, fiber_g, source)
values
  ('mill-protein-roti', 'Mill protein roti',
   ARRAY['mill roti','mills roti','protein roti','protein atta roti',
         'mill atta roti','mill protein atta roti','multigrain protein roti',
         'chakki atta roti','high protein roti']::text[],
   'roti_rice', true, '1 roti (40 g)', 40,
   140, 12, 19, 1.6, 4, 'manual')
on conflict (id) do update set
  name          = excluded.name,
  aliases       = excluded.aliases,
  category      = excluded.category,
  is_vegetarian = excluded.is_vegetarian,
  serving_size  = excluded.serving_size,
  serving_grams = excluded.serving_grams,
  calories      = excluded.calories,
  protein_g     = excluded.protein_g,
  carbs_g       = excluded.carbs_g,
  fat_g         = excluded.fat_g,
  fiber_g       = excluded.fiber_g,
  source        = excluded.source;

-- ── portion conversion ───────────────────────────────────────────────────────
-- So "2 mill roti" / "2 pieces" logs as 2 × 40 g rather than falling back to the
-- 100 g default. serving_grams already covers the piece case, but a piece row
-- keeps unit resolution explicit alongside the other breads.
insert into portion_conversions (food_id, unit, grams_equivalent)
select v.food_id, v.unit, v.grams
from (values
  ('mill-protein-roti','piece', 40),
  ('mill-protein-roti','roti',  40)
) as v(food_id, unit, grams)
where exists (select 1 from food_library f where f.id = v.food_id)
on conflict (food_id, unit) do nothing;
