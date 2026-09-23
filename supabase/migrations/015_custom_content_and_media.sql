-- 015_custom_content_and_media.sql
-- AestheticFit v2: custom foods, recipes, custom exercises, structured cues + media,
-- meal-log support for custom foods, and mid-workout swap immutability.
-- Postgres 15 / Supabase. Every user table enforces RLS on auth.uid() = user_id.

-------------------------------------------------------------------------------
-- 1. CUSTOM FOODS (+ recipes)
-- Per-user foods and composed dishes that extend the read-only food_library.
-- A recipe is just a custom_food with is_recipe = true (see recipe_ingredients).
-------------------------------------------------------------------------------
create table if not exists custom_foods (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  category      text,
  aliases       text[] default '{}',
  serving_label text not null default '1 serving',   -- e.g. "1 katori", "1 phulka"
  serving_grams numeric,                              -- optional calibrated weight
  calories      numeric not null,
  protein_g     numeric not null default 0,
  carbs_g       numeric not null default 0,
  fat_g         numeric not null default 0,
  fiber_g       numeric not null default 0,
  is_recipe     boolean not null default false,
  is_veg        boolean not null default true,
  source        text not null default 'manual'
                  check (source in ('manual','ai_parsed','ifct','barcode')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists custom_foods_user_idx      on custom_foods (user_id);
create index if not exists custom_foods_user_name_idx on custom_foods (user_id, name);

alter table custom_foods enable row level security;
create policy "own custom_foods" on custom_foods for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 2. RECIPE INGREDIENTS
-- Each ingredient points at EITHER the shared library OR another custom_food.
-- The one_food_ref check guarantees exactly one reference is set (clean FKs,
-- no polymorphic text columns). Ownership is inherited via the parent recipe.
-------------------------------------------------------------------------------
create table if not exists recipe_ingredients (
  id                uuid primary key default gen_random_uuid(),
  recipe_id         uuid not null references custom_foods(id) on delete cascade,
  library_food_id   text references food_library(id),
  custom_food_id    uuid references custom_foods(id),
  quantity_servings numeric not null default 1,
  constraint one_food_ref check (
    (library_food_id is not null)::int + (custom_food_id is not null)::int = 1
  )
);
create index if not exists recipe_ingredients_recipe_idx on recipe_ingredients (recipe_id);

alter table recipe_ingredients enable row level security;
create policy "own recipe_ingredients" on recipe_ingredients for all
  using   (exists (select 1 from custom_foods f where f.id = recipe_id and f.user_id = auth.uid()))
  with check (exists (select 1 from custom_foods f where f.id = recipe_id and f.user_id = auth.uid()));

-------------------------------------------------------------------------------
-- 3. MEAL LOGS: support custom foods + full macro snapshot (immutability)
-- A meal_log is an immutable record. It snapshots macros at log time, so later
-- edits to a recipe never rewrite history (and the TDEE engine sees clean data).
-------------------------------------------------------------------------------
alter table meal_logs
  add column if not exists custom_food_id uuid references custom_foods(id),
  add column if not exists item_label     text,               -- free text for one-off / AI items
  add column if not exists carbs_g        numeric default 0,
  add column if not exists fat_g          numeric default 0,
  add column if not exists fiber_g        numeric default 0,
  add column if not exists source         text default 'library'
                            check (source in ('library','custom','recipe','ai_parsed','quick_add'));

-- allow custom / AI / quick-add items that don't reference food_library
alter table meal_logs alter column food_id drop not null;

-- safety: any existing rows with food_id null predate custom_food_id,
-- so they're orphaned free-text entries — mark them quick_add so the
-- constraint doesn't reject them.
update meal_logs
   set source = 'quick_add'
 where food_id is null and custom_food_id is null and source = 'library';

-- exactly one identity path, unless it's a free-text quick add
alter table meal_logs drop constraint if exists meal_log_identity;
alter table meal_logs add constraint meal_log_identity check (
  source = 'quick_add'
  or (food_id is not null)::int + (custom_food_id is not null)::int = 1
);

-------------------------------------------------------------------------------
-- 4. EXERCISE LIBRARY: structured cues + media + injury tags
-- cues jsonb shape (enforced in app):
--   { "setup": [...], "execution": [...], "breathing": "...",
--     "common_mistakes": [...], "ruin_your_gains": ["the one that wastes the set"] }
-------------------------------------------------------------------------------
alter table exercise_library
  add column if not exists cues              jsonb default '{}'::jsonb,
  add column if not exists youtube_id        text,                 -- 11-char embed id
  add column if not exists gif_url           text,
  add column if not exists stability_demand  text
                            check (stability_demand in ('low','medium','high')),
  add column if not exists sfr_rating        int,                  -- stimulus-to-fatigue, 1-5
  add column if not exists contraindications text[] default '{}';  -- e.g. {cervical,shoulder}

-------------------------------------------------------------------------------
-- 5. CUSTOM EXERCISES (per-user, mirrors the library shape)
-------------------------------------------------------------------------------
create table if not exists custom_exercises (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  primary_muscle    text,
  secondary_muscles text[] default '{}',
  movement_pattern  text,
  equipment         text[] default '{}',
  difficulty        text,
  cues              jsonb default '{}'::jsonb,
  youtube_id        text,
  gif_url           text,
  created_at        timestamptz not null default now()
);
create index if not exists custom_exercises_user_idx on custom_exercises (user_id);

alter table custom_exercises enable row level security;
create policy "own custom_exercises" on custom_exercises for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 6. EXERCISE LOGS: mid-workout swaps + ad-hoc adds, with historical immutability
--
-- Principle: the PLAN is a mutable, versioned template. An exercise_log row is an
-- IMMUTABLE snapshot of what was actually performed. Swaps/additions are recorded
-- on the log and NEVER edit the plan or any past log. The progress engine keys off
-- the stable identity (library_exercise_id / custom_exercise_id) so it can follow a
-- lift across sessions regardless of where it sits in the plan.
-------------------------------------------------------------------------------
alter table exercise_logs
  add column if not exists library_exercise_id text references exercise_library(id),
  add column if not exists custom_exercise_id  uuid references custom_exercises(id),
  add column if not exists swapped_from_ref    text,     -- snapshot of the replaced id
  add column if not exists swap_reason         text,     -- injury | equipment_busy | preference | too_hard
  add column if not exists is_ad_hoc           boolean not null default false,
  add column if not exists plan_version_id     uuid;     -- plan version performed under

-- BACKFILL: exercise_logs.exercise_id is text (library ids) — copy into the new
-- dedicated column so the progress engine can key off it going forward.
update exercise_logs
   set library_exercise_id = exercise_id
 where library_exercise_id is null and exercise_id is not null;