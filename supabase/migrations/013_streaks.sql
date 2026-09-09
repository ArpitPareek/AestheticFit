-- streaks: workout/nutrition/overall streak tracking
create table streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  streak_type text not null check (streak_type in ('workout', 'nutrition', 'overall')),
  current_count int not null default 0,
  longest_count int not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

alter table streaks enable row level security;

create policy "Users can view own streaks"
  on streaks for select using (auth.uid() = user_id);

create policy "Users can insert own streaks"
  on streaks for insert with check (auth.uid() = user_id);

create policy "Users can update own streaks"
  on streaks for update using (auth.uid() = user_id);
