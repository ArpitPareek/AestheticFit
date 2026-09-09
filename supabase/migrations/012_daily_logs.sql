-- daily_logs: steps, sleep, water tracking
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  steps int,
  sleep_hours numeric,
  water_glasses int,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table daily_logs enable row level security;

create policy "Users can view own daily logs"
  on daily_logs for select using (auth.uid() = user_id);

create policy "Users can insert own daily logs"
  on daily_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own daily logs"
  on daily_logs for update using (auth.uid() = user_id);
