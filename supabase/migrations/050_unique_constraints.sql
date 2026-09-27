-- 050_unique_constraints.sql
-- Batch 0 / B24-B29: client hooks do find-then-insert without upsert, so
-- double-taps and network retries create duplicate rows (or crash with 23505).
-- Add the missing unique constraints so Batch 3 can safely switch every write
-- to .upsert(..., { onConflict: '<the constraint here>' }).
--
-- Every constraint is idempotent (drop existing dup rows first, then create).
-- weight_logs already has unique(user_id, log_date) from 009_weight_logs.sql —
-- verified here for completeness (no-op if it already exists).

-- ── skin_logs: unique(user_id, log_date, routine_type) ───────────────────────
-- Dedup any existing dupes first (keep the most recent row per group; drop the rest).
delete from skin_logs a
 using skin_logs b
 where a.user_id = b.user_id
   and a.log_date = b.log_date
   and a.routine_type = b.routine_type
   and a.created_at < b.created_at;
-- Also handle exact-tie created_at ties (rare but possible)
delete from skin_logs a
 using skin_logs b
 where a.user_id = b.user_id
   and a.log_date = b.log_date
   and a.routine_type = b.routine_type
   and a.created_at = b.created_at
   and a.id < b.id;

alter table skin_logs
  drop constraint if exists skin_logs_user_date_routine_uniq;
alter table skin_logs
  add constraint skin_logs_user_date_routine_uniq
  unique (user_id, log_date, routine_type);

-- ── streaks: unique(user_id, streak_type) ────────────────────────────────────
delete from streaks a
 using streaks b
 where a.user_id = b.user_id
   and a.streak_type = b.streak_type
   and (a.updated_at, a.current_count, a.id) < (b.updated_at, b.current_count, b.id);

alter table streaks
  drop constraint if exists streaks_user_type_uniq;
alter table streaks
  add constraint streaks_user_type_uniq
  unique (user_id, streak_type);

-- ── weight_logs: unique(user_id, log_date) — verify only ─────────────────────
-- Present since 009_weight_logs.sql. Defensive re-create for safety.
do $$
begin
  if not exists (
    select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
     where t.relname = 'weight_logs'
       and c.contype = 'u'
       and c.conname like '%user_id%log_date%'
  ) and not exists (
    -- 009_weight_logs.sql used inline `unique (user_id, log_date)` which creates
    -- an auto-named constraint. Also check by column list.
    select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join lateral (
        select array_agg(a.attname order by a.attnum) as cols
          from unnest(c.conkey) k
          join pg_attribute a on a.attrelid = t.oid and a.attnum = k
      ) cols on true
     where t.relname = 'weight_logs'
       and c.contype = 'u'
       and cols.cols = ARRAY['user_id','log_date']::name[]
  ) then
    -- No unique constraint found — dedup and create it.
    delete from weight_logs a
     using weight_logs b
     where a.user_id = b.user_id
       and a.log_date = b.log_date
       and a.created_at < b.created_at;
    alter table weight_logs
      add constraint weight_logs_user_date_uniq unique (user_id, log_date);
  end if;
end$$;

-- ── daily_logs: unique(user_id, log_date) — verify only ──────────────────────
-- Present since 012_daily_logs.sql. Defensive check identical to above.
do $$
begin
  if not exists (
    select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join lateral (
        select array_agg(a.attname order by a.attnum) as cols
          from unnest(c.conkey) k
          join pg_attribute a on a.attrelid = t.oid and a.attnum = k
      ) cols on true
     where t.relname = 'daily_logs'
       and c.contype = 'u'
       and cols.cols = ARRAY['user_id','log_date']::name[]
  ) then
    delete from daily_logs a
     using daily_logs b
     where a.user_id = b.user_id
       and a.log_date = b.log_date
       and a.created_at < b.created_at;
    alter table daily_logs
      add constraint daily_logs_user_date_uniq unique (user_id, log_date);
  end if;
end$$;

-- ── custom_foods: soft-delete column + unique(user_id, lower(name)) ──────────
alter table custom_foods
  add column if not exists deleted_at timestamptz;

-- Dedup non-deleted duplicates by (user_id, lower(name)); keep most recent.
delete from custom_foods a
 using custom_foods b
 where a.user_id = b.user_id
   and lower(a.name) = lower(b.name)
   and a.deleted_at is null
   and b.deleted_at is null
   and (a.updated_at, a.created_at, a.id) < (b.updated_at, b.created_at, b.id);

create unique index if not exists custom_foods_user_lower_name_uidx
  on custom_foods (user_id, lower(name))
  where deleted_at is null;

-- ── meal_logs: dedupe_key uuid + unique(user_id, dedupe_key) ─────────────────
-- Nullable — legacy rows have no key. Only NEW writes from Batch 3 will populate
-- it. Uniqueness enforced only when non-null via a partial unique index.
alter table meal_logs
  add column if not exists dedupe_key uuid;

create unique index if not exists meal_logs_user_dedupe_uidx
  on meal_logs (user_id, dedupe_key)
  where dedupe_key is not null;

-- ── verification ─────────────────────────────────────────────────────────────
--   -- Every uniqueness we added should show one row:
--   select tc.table_name, tc.constraint_name, string_agg(kcu.column_name, ',')
--     from information_schema.table_constraints tc
--     join information_schema.key_column_usage kcu
--       on kcu.constraint_name = tc.constraint_name
--    where tc.constraint_type = 'UNIQUE'
--      and tc.table_name in ('skin_logs','streaks','weight_logs','daily_logs','custom_foods','meal_logs')
--    group by 1,2 order by 1,2;
--
--   -- No duplicate rows should remain:
--   select 'skin_logs' t, user_id, log_date, routine_type, count(*)
--     from skin_logs group by 1,2,3,4 having count(*) > 1;
