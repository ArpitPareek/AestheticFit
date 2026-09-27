-- 051_ai_food_estimates_user_id.sql
-- Batch 0 / B41: `ai_food_estimates` is shared-global today (see 041_food_data
-- naming note) — one user's bad AI estimate is served to the other user
-- forever, and there is no way to "fix and remember" for just yourself.
--
-- Fix: make estimates per-user. Add user_id, backfill NULLs (there is no owner
-- to assign; leave NULL and treat them as a global fallback), drop the global
-- unique(normalized_name), add unique(user_id, normalized_name) so each user
-- can keep their own estimate for a given name.
--
-- Read policy stays permissive (any authenticated user can read any estimate —
-- global-nullable rows continue to serve as fallback). Insert policy tightens
-- to require user_id = auth.uid() so a user cannot pollute another user's row.
--
-- Idempotent.

alter table ai_food_estimates
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Drop the old global-uniqueness constraint (was auto-named or inline;
-- both cases handled).
do $$
declare
  cname text;
begin
  select c.conname into cname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join lateral (
      select array_agg(a.attname order by a.attnum) as cols
        from unnest(c.conkey) k
        join pg_attribute a on a.attrelid = t.oid and a.attnum = k
    ) cols on true
   where t.relname = 'ai_food_estimates'
     and c.contype = 'u'
     and cols.cols = ARRAY['normalized_name']::name[]
   limit 1;
  if cname is not null then
    execute format('alter table ai_food_estimates drop constraint %I', cname);
  end if;
end$$;

-- Also drop any unique INDEX (not constraint) on normalized_name alone.
do $$
declare
  iname text;
begin
  select i.indexrelid::regclass::text into iname
    from pg_index i
    join pg_class c on c.oid = i.indexrelid
    join pg_class t on t.oid = i.indrelid
   where t.relname = 'ai_food_estimates'
     and i.indisunique
     and i.indnatts = 1
     and (
       select array_agg(a.attname order by a.attnum)
         from unnest(i.indkey::int[]) k
         join pg_attribute a on a.attrelid = t.oid and a.attnum = k
     ) = ARRAY['normalized_name']::name[]
     and not i.indisprimary
   limit 1;
  if iname is not null then
    execute format('drop index if exists %s', iname);
  end if;
end$$;

-- New per-user uniqueness. NULL user_id (legacy global rows) is allowed and
-- unique-per-name via a separate partial index so we don't accidentally allow
-- two global rows for the same name.
create unique index if not exists ai_food_estimates_user_norm_uidx
  on ai_food_estimates (user_id, normalized_name)
  where user_id is not null;

create unique index if not exists ai_food_estimates_global_norm_uidx
  on ai_food_estimates (normalized_name)
  where user_id is null;

-- Tighten insert policy: an authenticated user may only insert rows for
-- themselves. Read stays open (a NULL-owner row is treated as global fallback).
drop policy if exists "Authenticated can add ai food estimates" on ai_food_estimates;
create policy "Users can add own ai food estimates"
  on ai_food_estimates for insert to authenticated
  with check (user_id = auth.uid());

-- Users can update / delete their own estimates too (for "fix and remember" —
-- feature F06 in the playbook backlog).
drop policy if exists "Users can update own ai food estimates" on ai_food_estimates;
create policy "Users can update own ai food estimates"
  on ai_food_estimates for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users can delete own ai food estimates" on ai_food_estimates;
create policy "Users can delete own ai food estimates"
  on ai_food_estimates for delete to authenticated
  using (user_id = auth.uid());

-- ── verification ─────────────────────────────────────────────────────────────
--   \d ai_food_estimates                            -- user_id column present
--   select policyname, cmd from pg_policies where tablename = 'ai_food_estimates';
--   -- expect: 4 policies (select-all-auth, insert-own, update-own, delete-own)
--
--   select indexname, indexdef from pg_indexes
--    where tablename = 'ai_food_estimates';
--   -- expect: two partial unique indexes (per-user + global-null)
