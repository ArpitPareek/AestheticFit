-- workout_logs: per-session workout records
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  plan_id uuid references workout_plans on delete set null,
  plan_version int,
  workout_date date not null,
  day_label text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table workout_logs enable row level security;

create policy "Users can view own workout logs"
  on workout_logs for select using (auth.uid() = user_id);

create policy "Users can insert own workout logs"
  on workout_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own workout logs"
  on workout_logs for update using (auth.uid() = user_id);
