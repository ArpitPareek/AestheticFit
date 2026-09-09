-- weight_logs: daily weigh-ins
create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  weight_kg numeric not null,
  waist_cm numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table weight_logs enable row level security;

create policy "Users can view own weight logs"
  on weight_logs for select using (auth.uid() = user_id);

create policy "Users can insert own weight logs"
  on weight_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own weight logs"
  on weight_logs for update using (auth.uid() = user_id);
