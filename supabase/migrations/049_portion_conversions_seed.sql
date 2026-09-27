-- 049_portion_conversions_seed.sql
-- Batch 0 / B01+B08: `parse-meal/index.ts` gramsForMatchedFood falls back to
-- `quantity × serving_grams` when there's no matching portion_conversions row
-- for the unit. For any 100 g/ml row (oils, nuts, biscuits, dates, grapes,
-- chocolate, etc.) that means "1 tsp olive oil" logs as 100 g / 884 kcal and
-- "5 almonds" logs as 500 g / 2800 kcal — an order-of-magnitude bug across
-- hundreds of foods.
--
-- Batch 1 will add a general fallback in the edge function. This migration is
-- the direct fix: seed real per-piece / per-tsp / per-tbsp grams for the
-- household units that show up in everyday Indian meals.
--
-- All idempotent (ON CONFLICT DO NOTHING). Only inserts rows where the target
-- food_library id exists — safe when some seed files haven't been loaded yet.

-- ── Oils, ghee, butter, honey, syrups — tsp = 5 g, tbsp = 15 g ───────────────
-- Density-corrected grams: oils ≈ 0.92 g/ml, ghee ≈ 0.92, butter ≈ 0.91,
-- honey ≈ 1.42, syrups ≈ 1.3. Serving units in the household kitchen are
-- volumetric, so we round to volume × density.
insert into portion_conversions (food_id, unit, grams_equivalent)
select v.food_id, v.unit, v.grams
from (values
  -- Cooking oils (5 ml tsp ≈ 4.6 g; round to 5 g so the parser matches "1 tsp oil" cleanly)
  ('cooking-oil','tsp',5),   ('cooking-oil','tbsp',14),   ('cooking-oil','ml',0.92),
  ('mustard-oil','tsp',5),   ('mustard-oil','tbsp',14),   ('mustard-oil','ml',0.92),
  ('coconut-oil','tsp',5),   ('coconut-oil','tbsp',14),   ('coconut-oil','ml',0.92),
  ('olive-oil',  'tsp',5),   ('olive-oil',  'tbsp',14),   ('olive-oil',  'ml',0.92),
  -- Ghee / butter (often measured by tsp/tbsp)
  ('ghee',       'tsp',5),   ('ghee',       'tbsp',14),
  ('butter',     'tsp',5),   ('butter',     'tbsp',14),
  -- Sweeteners
  ('honey',      'tsp',7),   ('honey',      'tbsp',21),   ('honey','ml',1.42),
  ('sugar',      'tsp',4),   ('sugar',      'tbsp',12),
  ('jaggery',    'tsp',5),   ('jaggery',    'tbsp',15),
  -- Peanut / nut butters
  ('peanut-butter','tsp',5), ('peanut-butter','tbsp',16),
  ('almond-butter','tsp',5), ('almond-butter','tbsp',16)
) as v(food_id, unit, grams)
where exists (select 1 from food_library f where f.id = v.food_id)
on conflict (food_id, unit) do nothing;

-- ── Nuts, dry fruit, seeds — per-piece grams ─────────────────────────────────
-- Average kernel/piece weights sourced from USDA/IFCT. `handful` ≈ 20-30 g,
-- pick a middle value that matches the parser's typical AI estimate.
insert into portion_conversions (food_id, unit, grams_equivalent)
select v.food_id, v.unit, v.grams
from (values
  ('almond',     'piece',1.2), ('almond',     'handful',20), ('almond',     'tbsp',8),
  ('cashew',     'piece',1.5), ('cashew',     'handful',20), ('cashew',     'tbsp',9),
  ('walnut',     'piece',4.0), ('walnut',     'handful',20), ('walnut',     'tbsp',8),
  ('pistachio',  'piece',0.7), ('pistachio',  'handful',20), ('pistachio',  'tbsp',8),
  ('peanut',     'piece',0.8), ('peanut',     'handful',25), ('peanut',     'tbsp',9),
  ('raisin',     'piece',0.5), ('raisin',     'handful',15), ('raisin',     'tbsp',10),
  ('date',       'piece',8),   ('date',       'handful',24),
  ('fig',        'piece',8),
  ('chia-seed',  'tsp',3),     ('chia-seed',  'tbsp',10),
  ('flax-seed',  'tsp',3),     ('flax-seed',  'tbsp',10),
  ('sesame-seed','tsp',3),     ('sesame-seed','tbsp',9),
  ('sunflower-seed','tsp',3),  ('sunflower-seed','tbsp',9),
  ('pumpkin-seed','tsp',4),    ('pumpkin-seed','tbsp',10)
) as v(food_id, unit, grams)
where exists (select 1 from food_library f where f.id = v.food_id)
on conflict (food_id, unit) do nothing;

-- ── Fruit — per-piece grams (edible portion) ─────────────────────────────────
insert into portion_conversions (food_id, unit, grams_equivalent)
select v.food_id, v.unit, v.grams
from (values
  ('grape',      'piece',5),   ('grape',      'handful',30),
  ('banana',     'piece',120),
  ('apple',      'piece',180),
  ('orange',     'piece',150),
  ('kiwi',       'piece',75),
  ('strawberry', 'piece',12),  ('strawberry', 'handful',80),
  ('blueberry',  'piece',1.4), ('blueberry',  'handful',30),
  ('cherry',     'piece',6),
  ('plum',       'piece',65),
  ('guava',      'piece',150)
) as v(food_id, unit, grams)
where exists (select 1 from food_library f where f.id = v.food_id)
on conflict (food_id, unit) do nothing;

-- ── Biscuits, breads, rotis, eggs — per-piece grams ──────────────────────────
insert into portion_conversions (food_id, unit, grams_equivalent)
select v.food_id, v.unit, v.grams
from (values
  ('biscuit',       'piece',8),
  ('marie-biscuit', 'piece',6),
  ('parle-g',       'piece',5),
  ('digestive-biscuit','piece',15),
  ('cream-biscuit', 'piece',12),
  ('rusk',          'piece',18),
  ('bread-slice',   'piece',25), ('bread-slice','slice',25),
  ('brown-bread',   'piece',30), ('brown-bread','slice',30),
  ('wheat-roti',    'piece',30), ('wheat-roti','small',25), ('wheat-roti','large',45),
  ('multigrain-roti','piece',35),
  ('plain-paratha', 'piece',60), ('plain-paratha','small',45), ('plain-paratha','large',80),
  ('boiled-egg',    'piece',50),
  ('egg-whole',     'piece',50),
  ('idli',          'piece',60),
  ('dosa',          'piece',80),
  ('samosa',        'piece',60),
  ('vada',          'piece',35)
) as v(food_id, unit, grams)
where exists (select 1 from food_library f where f.id = v.food_id)
on conflict (food_id, unit) do nothing;

-- ── Chocolate, snacks, sweets ────────────────────────────────────────────────
insert into portion_conversions (food_id, unit, grams_equivalent)
select v.food_id, v.unit, v.grams
from (values
  ('dark-chocolate','piece',10), ('dark-chocolate','square',10), ('dark-chocolate','bar',40),
  ('milk-chocolate','piece',10), ('milk-chocolate','square',10), ('milk-chocolate','bar',40),
  ('gulab-jamun',   'piece',35),
  ('rasgulla',      'piece',30),
  ('barfi',         'piece',25),
  ('laddoo',        'piece',30),
  ('kaju-katli',    'piece',10)
) as v(food_id, unit, grams)
where exists (select 1 from food_library f where f.id = v.food_id)
on conflict (food_id, unit) do nothing;

-- ── Beverages — glass / cup / ml (aqueous default density = 1) ───────────────
insert into portion_conversions (food_id, unit, grams_equivalent)
select v.food_id, v.unit, v.grams
from (values
  ('milk',          'glass',200), ('milk',          'cup',240), ('milk','ml',1.03),
  ('tea-with-milk', 'glass',150), ('tea-with-milk', 'cup',180),
  ('coffee-with-milk','glass',150), ('coffee-with-milk','cup',180),
  ('black-coffee',  'cup',180),
  ('chaas',         'glass',200), ('chaas',         'cup',240),
  ('lassi',         'glass',250), ('lassi',         'cup',240),
  ('orange-juice',  'glass',200), ('orange-juice',  'cup',240),
  ('coconut-water', 'glass',200), ('coconut-water', 'cup',240)
) as v(food_id, unit, grams)
where exists (select 1 from food_library f where f.id = v.food_id)
on conflict (food_id, unit) do nothing;

-- ── verification ─────────────────────────────────────────────────────────────
--   -- Sanity: every oil should now have tsp + tbsp
--   select f.id, count(*) filter (where p.unit='tsp') as tsp,
--                count(*) filter (where p.unit='tbsp') as tbsp
--     from food_library f
--     left join portion_conversions p on p.food_id = f.id
--    where f.category ilike '%oil%' or f.id in ('ghee','butter')
--    group by f.id order by f.id;
--
--   -- Almonds piece should be ~1.2 g
--   select * from portion_conversions where food_id = 'almond';
