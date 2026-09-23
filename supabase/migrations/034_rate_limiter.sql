-- 034_rate_limiter.sql
-- Per-user, per-bucket rate limiting table for Edge Functions.
-- The table is service-role only: RLS is enabled with NO policies,
-- so authenticated callers get no access; the service role bypasses RLS.
--
-- The check_rate_limit_fn() SQL function is SECURITY DEFINER so Edge Functions
-- can call it via supabase.rpc() with the anon key while still hitting the
-- service-role-owned table atomically.
--
-- ROLLBACK:
--   drop function if exists check_rate_limit_fn(uuid, text, int, int);
--   drop table if exists rate_limit;

create table if not exists rate_limit (
  user_id      uuid        not null,
  bucket       text        not null,
  window_start timestamptz not null,
  count        int         not null default 1,
  primary key  (user_id, bucket, window_start)
);

-- Primary key IS the index; explicit secondary index not needed.
create index if not exists rate_limit_user_bucket_window_idx
  on rate_limit (user_id, bucket, window_start);

alter table rate_limit enable row level security;
-- No policies → service-role only. Authenticated users cannot read or write
-- this table directly; they must go through check_rate_limit_fn().

-- Atomic insert-or-increment. SECURITY DEFINER runs as table owner (service
-- role), so the function can write rate_limit even when called via the anon
-- or JWT-authed key from an Edge Function.
create or replace function check_rate_limit_fn(
  p_user_id        uuid,
  p_bucket         text,
  p_limit          int  default 30,
  p_window_seconds int  default 60
)
returns table (allowed boolean, remaining int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count        int;
begin
  -- Floor now() to the nearest window boundary.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  -- Atomic insert-or-increment (single statement, no TOCTOU gap).
  insert into rate_limit (user_id, bucket, window_start, count)
  values (p_user_id, p_bucket, v_window_start, 1)
  on conflict (user_id, bucket, window_start)
  do update set count = rate_limit.count + 1
  returning rate_limit.count into v_count;

  return query
    select v_count <= p_limit,
           greatest(0, p_limit - v_count);
end;
$$;

-- Callable by authenticated users (the Edge Function runs with a JWT).
grant execute on function check_rate_limit_fn(uuid, text, int, int) to authenticated;
