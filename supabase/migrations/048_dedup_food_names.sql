-- 048_dedup_food_names.sql
-- Batch 0: multiple seed files (seed-foods.sql, seed-food-everyday.sql,
-- seed-food-staples.sql, seed-food-ifct.sql) can seed rows with the same
-- lower(name) but different ids — e.g. "Moong Dal" as both moong-dal (cooked
-- 200 g/140 kcal) and moong-dal-cooked (150 g/150 kcal). This breaks fuzzy
-- matching: the parser sometimes returns the 100 g dry variant when the user
-- meant the cooked bowl.
--
-- Fix: pick a canonical row per lower(name), delete the duplicates, and add a
-- partial unique index so no future seed can reintroduce the collision.
--
-- Merge rule per duplicate group:
--   Keep the row with the MOST portion_conversions (parser calibration is what
--   we care about); tiebreak on shorter id (usually the cleaner slug), then
--   lexical.
--
-- Safety:
--   * meal_logs.food_id ON DELETE SET NULL — historical logs already snapshot
--     macros in columns (008_meal_logs.sql + 015_custom_content_and_media.sql).
--   * portion_conversions.food_id / food_aliases.food_id ON DELETE CASCADE —
--     losing conversions/aliases on the losing row is acceptable because the
--     winner has more of them anyway; we migrate the losers' aliases to the
--     winner first.
--   * recipe_ingredients.food_id ON DELETE (no action defined; existence
--     unlikely for the affected ids). Migration will fail loudly if there's a
--     protected reference — that's the right behavior.
--
-- Idempotent — the CTE returns zero rows on a re-run.

-- 1. Migrate aliases from soon-to-be-deleted rows to the winners so we don't
-- lose alias coverage. Do this BEFORE the delete (cascade would drop them).
with dups as (
  select
    id,
    lower(name) as lname,
    (select count(*) from portion_conversions p where p.food_id = f.id) as pc_cnt,
    length(id) as id_len
  from food_library f
),
ranked as (
  select
    id,
    lname,
    row_number() over (
      partition by lname
      order by pc_cnt desc, id_len asc, id asc
    ) as rn
  from dups
),
winners as (
  select lname, id as winner_id from ranked where rn = 1
),
losers as (
  select r.lname, r.id as loser_id, w.winner_id
  from ranked r
  join winners w using (lname)
  where r.rn > 1
)
insert into food_aliases (alias_text, food_id)
select fa.alias_text, l.winner_id
  from food_aliases fa
  join losers l on l.loser_id = fa.food_id
on conflict (alias_text, food_id) do nothing;

-- Also copy the loser's inline aliases[] and the loser's name itself onto the
-- winner as food_aliases entries (so "moong dal" text still resolves even after
-- moong-dal-cooked is gone).
with dups as (
  select
    id,
    lower(name) as lname,
    (select count(*) from portion_conversions p where p.food_id = f.id) as pc_cnt,
    length(id) as id_len,
    name,
    aliases
  from food_library f
),
ranked as (
  select
    id, lname, name, aliases,
    row_number() over (
      partition by lname
      order by pc_cnt desc, id_len asc, id asc
    ) as rn
  from dups
),
winners as (select lname, id as winner_id from ranked where rn = 1),
losers as (
  select r.lname, r.id as loser_id, r.name as loser_name, r.aliases as loser_aliases,
         w.winner_id
    from ranked r join winners w using (lname)
   where r.rn > 1
),
alias_rows as (
  select lower(l.loser_name) as alias_text, l.winner_id from losers l
  union
  select lower(unnest(l.loser_aliases)), l.winner_id from losers l
    where l.loser_aliases is not null and array_length(l.loser_aliases,1) > 0
)
insert into food_aliases (alias_text, food_id)
select alias_text, winner_id
  from alias_rows
 where alias_text is not null and length(trim(alias_text)) > 0
on conflict (alias_text, food_id) do nothing;

-- 2. Delete the losing rows. FK to meal_logs is SET NULL; historical macros
-- are already snapshotted in meal_logs columns so nothing user-visible changes.
with dups as (
  select
    id,
    lower(name) as lname,
    (select count(*) from portion_conversions p where p.food_id = f.id) as pc_cnt,
    length(id) as id_len
  from food_library f
),
ranked as (
  select id, lname,
    row_number() over (
      partition by lname
      order by pc_cnt desc, id_len asc, id asc
    ) as rn
  from dups
)
delete from food_library
 where id in (select id from ranked where rn > 1);

-- 3. Add the partial unique index so future seeds can't reintroduce the bug.
-- Partial (where deleted_at is null would need a column we don't have here) —
-- we just add a straight unique index on lower(name). If we ever soft-delete
-- food_library rows, revisit.
create unique index if not exists food_library_lower_name_uidx
  on food_library (lower(name));

-- ── verification ─────────────────────────────────────────────────────────────
--   -- must return zero rows:
--   select lower(name) as lname, count(*) c
--     from food_library group by lower(name) having count(*) > 1;
--
--   -- confirm moong dal is a single row now:
--   select id, name, serving_grams, calories from food_library
--    where lower(name) = 'moong dal';
