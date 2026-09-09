-- skin_logs: daily skincare routine tracking
create table skin_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  routine_type text not null check (routine_type in ('am', 'pm')),
  steps_done jsonb not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

alter table skin_logs enable row level security;

create policy "Users can view own skin logs"
  on skin_logs for select using (auth.uid() = user_id);

create policy "Users can insert own skin logs"
  on skin_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own skin logs"
  on skin_logs for update using (auth.uid() = user_id);
