-- 016_tdee_nutrition_engine.sql
-- AestheticFit v2: adaptive TDEE + dynamic macro engine.
-- Config + append-only estimate history + versioned targets + weight-trend view.
-- The Edge Function `adjust-nutrition-targets` writes tdee_estimates and
-- nutrition_target_history via the service role (bypasses RLS, scoped per user).

-------------------------------------------------------------------------------
-- 1. NUTRITION CONFIG (per-user engine settings; one row per user)
--    goal_mode drives WHAT the engine optimizes for:
--      recomp   -> hold weight, correct drift, watch waist (Person A)
--      cut      -> pursue target_rate_kg_week loss, protect muscle (Person B)
--      lean_bulk/maintain -> supported for completeness
-------------------------------------------------------------------------------
create table if not exists nutrition_config (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  goal_mode            text not null default 'cut'
                         check (goal_mode in ('recomp','cut','lean_bulk','maintain')),
  trend_window_days    int  not null default 14,     -- A:14, B:28 (>= cycle length)
  target_rate_kg_week  numeric not null default 0,   -- negative = intended loss
  calorie_floor        int  not null,                -- hard safety floor
  calorie_cap          int,                          -- optional upper guard
  protein_g_target     int  not null,                -- absolute daily protein floor
  activity_multiplier  numeric not null default 1.45,-- seed only; adaptive TDEE takes over
  min_log_adherence    numeric not null default 0.7, -- fraction of days logged to allow adjust
  adjust_interval_days int  not null default 14,
  last_adjusted_at     date,
  updated_at           timestamptz not null default now()
);
alter table nutrition_config enable row level security;
create policy "own nutrition_config" on nutrition_config for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 2. TDEE ESTIMATES (append-only audit of every calculation the engine makes)
--    Client can read its own history; writes come from the service role only.
-------------------------------------------------------------------------------
create table if not exists tdee_estimates (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  calc_date             date not null default current_date,
  method                text not null check (method in ('seed_mifflin','adaptive')),
  window_days           int,
  avg_intake_kcal       numeric,
  trend_weight_start_kg numeric,
  trend_weight_end_kg   numeric,
  weight_delta_kg       numeric,
  estimated_tdee_kcal   numeric,
  log_adherence         numeric,   -- 0..1 fraction of days with intake logged
  confidence            text check (confidence in ('low','medium','high')),
  created_at            timestamptz not null default now()
);
create index if not exists tdee_estimates_user_idx on tdee_estimates (user_id, calc_date desc);
alter table tdee_estimates enable row level security;
create policy "own tdee_estimates read" on tdee_estimates for select
  using (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 3. NUTRITION TARGETS (current live row per user; the engine updates this)
--    One row per user. The edge function reads + writes this table; the client
--    reads it for daily display. History is in nutrition_target_history below.
-------------------------------------------------------------------------------
create table if not exists nutrition_targets (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  calories   int not null,
  protein_g  int not null,
  carbs_g    int not null,
  fat_g      int not null,
  fiber_g    int,
  updated_at timestamptz not null default now()
);
alter table nutrition_targets enable row level security;
create policy "own nutrition_targets" on nutrition_targets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 5. NUTRITION TARGET HISTORY (versioned changes; nutrition_targets = current row)
--    reason documents WHY a change happened; source separates engine vs manual.
-------------------------------------------------------------------------------
create table if not exists nutrition_target_history (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  effective_date date not null default current_date,
  calories       int not null,
  protein_g      int not null,
  carbs_g        int not null,
  fat_g          int not null,
  fiber_g        int,
  deficit_kcal   int,        -- vs estimated TDEE (negative for a cut)
  goal_mode      text,
  reason         text,       -- seed | stall_adjust | too_fast_adjust | diet_break | manual ...
  source         text default 'engine' check (source in ('engine','manual')),
  created_at     timestamptz not null default now()
);
create index if not exists nth_user_idx on nutrition_target_history (user_id, effective_date desc);
alter table nutrition_target_history enable row level security;
create policy "own nth read"   on nutrition_target_history for select
  using (auth.uid() = user_id);
create policy "own nth manual" on nutrition_target_history for insert
  with check (auth.uid() = user_id and source = 'manual');

-------------------------------------------------------------------------------
-- 6. WEIGHT TREND VIEW (time-window moving averages; app/engine pick per user)
--    RANGE ... interval smooths over missing days (a skipped weigh-in won't skew
--    the mean). security_invoker = on so each user only sees their own rows via
--    the underlying weight_logs RLS.
-------------------------------------------------------------------------------
create or replace view weight_trend with (security_invoker = on) as
select
  w.user_id,
  w.log_date,
  w.weight_kg,
  w.waist_cm,
  avg(w.weight_kg) over (
    partition by w.user_id order by w.log_date
    range between interval '6 days'  preceding and current row) as ma_7d,
  avg(w.weight_kg) over (
    partition by w.user_id order by w.log_date
    range between interval '13 days' preceding and current row) as ma_14d,
  avg(w.weight_kg) over (
    partition by w.user_id order by w.log_date
    range between interval '27 days' preceding and current row) as ma_28d
from weight_logs w;