-- workout_plans: generated training programs
create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  assessment_id uuid references assessments on delete set null,
  plan_version int not null default 1,
  plan_name text not null,
  plan_data jsonb not null default '{}',
  phase int not null default 1,
  total_phases int not null default 1,
  weeks_per_phase int not null default 4,
  start_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table workout_plans enable row level security;

create policy "Users can view own plans"
  on workout_plans for select using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on workout_plans for insert with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on workout_plans for update using (auth.uid() = user_id);
