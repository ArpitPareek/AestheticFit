-- exercise_logs: individual exercise records within a workout
create table exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  workout_log_id uuid not null references workout_logs on delete cascade,
  exercise_id text references exercise_library on delete set null,
  exercise_name text not null,
  order_index int not null default 0,
  sets jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table exercise_logs enable row level security;

create policy "Users can view own exercise logs"
  on exercise_logs for select using (auth.uid() = user_id);

create policy "Users can insert own exercise logs"
  on exercise_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own exercise logs"
  on exercise_logs for update using (auth.uid() = user_id);
