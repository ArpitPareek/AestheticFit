-- 055_fix_partial_index_arbiters.sql
-- Batch 3 caveat follow-up: the partial unique indexes created in migration
-- 050 (custom_foods_user_lower_name_uidx, meal_logs_user_dedupe_uidx) and 051
-- (ai_food_estimates_user_norm_uidx) cannot be used as ON CONFLICT arbiters
-- through supabase-js `.upsert(..., { onConflict: 'col,col' })`. PostgreSQL
-- requires the ON CONFLICT clause to repeat the index predicate when the
-- arbiter is a partial index — supabase-js exposes only a column list, so the
-- upsert throws at runtime ("no unique or exclusion constraint matching...").
--
-- Fix: replace each partial arbiter with a plain (non-partial) unique that a
-- column-list-only client can hit.
--
--   1. meal_logs.dedupe_key — drop WHERE dedupe_key IS NOT NULL. Legacy rows
--      with NULL dedupe_key stay because Postgres UNIQUE treats NULL as
--      distinct (i.e. multiple NULL rows are allowed).
--   2. custom_foods — add a generated STORED column `name_lower` so the arbiter
--      is column-based, not an expression. Drop WHERE deleted_at IS NULL.
--      Soft-delete callers must free the slot (rename, or hard-delete) —
--      cheaper than every write going through an RPC.
--   3. ai_food_estimates — drop WHERE user_id IS NOT NULL from the per-user
--      arbiter. NULL-owner rows remain policed by the separate
--      `ai_food_estimates_global_norm_uidx` (also partial; enforcement-only,
--      never an upsert target — untouched here).

-- ── meal_logs ────────────────────────────────────────────────────────────────
drop index if exists meal_logs_user_dedupe_uidx;
alter table meal_logs
  drop constraint if exists meal_logs_user_dedupe_uniq;
alter table meal_logs
  add constraint meal_logs_user_dedupe_uniq unique (user_id, dedupe_key);
-- Multiple NULL dedupe_key rows still allowed; only non-NULL keys deduplicate.

-- ── custom_foods ─────────────────────────────────────────────────────────────
alter table custom_foods
  add column if not exists name_lower text
    generated always as (lower(name)) stored;

-- Dedup across ALL rows (including soft-deleted) — arbiter is no longer scoped
-- by deleted_at, so any pre-existing name collisions have to be resolved.
delete from custom_foods a
 using custom_foods b
 where a.user_id = b.user_id
   and a.name_lower = b.name_lower
   and (a.updated_at, a.created_at, a.id) < (b.updated_at, b.created_at, b.id);

drop index if exists custom_foods_user_lower_name_uidx;
alter table custom_foods
  drop constraint if exists custom_foods_user_name_lower_uniq;
alter table custom_foods
  add constraint custom_foods_user_name_lower_uniq
  unique (user_id, name_lower);

-- ── ai_food_estimates ────────────────────────────────────────────────────────
-- Replace partial per-user index with a plain unique. The separate
-- `ai_food_estimates_global_norm_uidx` (WHERE user_id IS NULL) stays for
-- enforcement of legacy global rows; no client upserts against it.
drop index if exists ai_food_estimates_user_norm_uidx;
alter table ai_food_estimates
  drop constraint if exists ai_food_estimates_user_norm_uniq;
alter table ai_food_estimates
  add constraint ai_food_estimates_user_norm_uniq
  unique (user_id, normalized_name);

-- ── verification ─────────────────────────────────────────────────────────────
--   -- All three arbiter constraints should now be plain (non-partial) uniques:
--   select tc.table_name, tc.constraint_name, string_agg(kcu.column_name, ',' order by kcu.ordinal_position) as cols
--     from information_schema.table_constraints tc
--     join information_schema.key_column_usage kcu using (constraint_name, table_name)
--    where tc.constraint_type = 'UNIQUE'
--      and tc.table_name in ('meal_logs','custom_foods','ai_food_estimates')
--    group by 1,2 order by 1,2;
--   -- expect (at minimum):
--   --   ai_food_estimates | ai_food_estimates_user_norm_uniq  | user_id,normalized_name
--   --   custom_foods      | custom_foods_user_name_lower_uniq | user_id,name_lower
--   --   meal_logs         | meal_logs_user_dedupe_uniq        | user_id,dedupe_key
--
--   -- Client-side onConflict values should be updated accordingly:
--   --   custom_foods  → onConflict: 'user_id,name_lower'
--   --   ai_food_estimates → onConflict: 'user_id,normalized_name'  (and pass user_id!)
--   --   meal_logs → onConflict: 'user_id,dedupe_key'  (already correct)
