-- 042_food_id_backfill.sql
-- B2b — Backfill historical meal_logs.food_id against the new food_library
-- (post-F1: IFCT rows + food_aliases now exist). Matches meal_logs rows where
-- food_id is still null to a food_library id, by exact (case/whitespace
-- insensitive) match against:
--   1. food_library.name
--   2. food_aliases.alias_text
--   3. food_library.aliases[] (the inline alias array)
-- in that priority order. Deliberately NOT fuzzy/trigram — this is a one-time
-- historical backfill, not live parsing, so it only accepts matches that are
-- unambiguous (exactly one distinct food_id per candidate name). Anything
-- ambiguous or with zero matches is left null; nothing is guessed.
--
-- RUN PART 1 (PREVIEW) FIRST. Only run PART 2 (UPDATE) after reviewing counts.
--
-- Idempotent: PART 2 only touches rows where food_id is still null, so a
-- second run of PART 2 updates 0 rows.
--
-- ROLLBACK: there is no automatic rollback (this only fills nulls, never
-- overwrites an existing food_id). To undo a specific backfill run, restore
-- food_id to null for the affected rows from a pre-migration backup.

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1 — PREVIEW (run this first; no writes)
-- ═══════════════════════════════════════════════════════════════════════════
with candidates as (
  select
    ml.id,
    ml.food_name,
    coalesce(
      (select case when count(*) = 1 then min(fl.id) end
         from food_library fl
         where lower(trim(fl.name)) = lower(trim(ml.food_name))),
      (select case when count(distinct fa.food_id) = 1 then min(fa.food_id) end
         from food_aliases fa
         where lower(trim(fa.alias_text)) = lower(trim(ml.food_name))),
      (select case when count(distinct fl2.id) = 1 then min(fl2.id) end
         from food_library fl2
         where lower(trim(ml.food_name)) = any (
           select lower(trim(a)) from unnest(fl2.aliases) as a
         ))
    ) as matched_food_id
  from meal_logs ml
  where ml.food_id is null
)
select
  count(*)                                         as total_null_food_id,
  count(*) filter (where matched_food_id is not null) as would_match,
  count(*) filter (where matched_food_id is null)     as would_stay_null
from candidates;

-- Optional: see which unmatched food_name values are most common, to spot
-- aliases worth adding to food_aliases before running PART 2.
--
-- with candidates as (
--   select ml.food_name,
--     coalesce(
--       (select case when count(*) = 1 then min(fl.id) end from food_library fl
--          where lower(trim(fl.name)) = lower(trim(ml.food_name))),
--       (select case when count(distinct fa.food_id) = 1 then min(fa.food_id) end from food_aliases fa
--          where lower(trim(fa.alias_text)) = lower(trim(ml.food_name))),
--       (select case when count(distinct fl2.id) = 1 then min(fl2.id) end from food_library fl2
--          where lower(trim(ml.food_name)) = any (select lower(trim(a)) from unnest(fl2.aliases) as a))
--     ) as matched_food_id
--   from meal_logs ml
--   where ml.food_id is null
-- )
-- select food_name, count(*) from candidates where matched_food_id is null
-- group by food_name order by count(*) desc limit 20;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2 — UPDATE (run only after reviewing PART 1's counts)
-- ═══════════════════════════════════════════════════════════════════════════
with candidates as (
  select
    ml.id,
    coalesce(
      (select case when count(*) = 1 then min(fl.id) end
         from food_library fl
         where lower(trim(fl.name)) = lower(trim(ml.food_name))),
      (select case when count(distinct fa.food_id) = 1 then min(fa.food_id) end
         from food_aliases fa
         where lower(trim(fa.alias_text)) = lower(trim(ml.food_name))),
      (select case when count(distinct fl2.id) = 1 then min(fl2.id) end
         from food_library fl2
         where lower(trim(ml.food_name)) = any (
           select lower(trim(a)) from unnest(fl2.aliases) as a
         ))
    ) as matched_food_id
  from meal_logs ml
  where ml.food_id is null
)
update meal_logs ml
set food_id = c.matched_food_id
from candidates c
where ml.id = c.id
  and c.matched_food_id is not null;
