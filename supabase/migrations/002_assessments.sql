-- assessments: questionnaire responses
create table assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  version int not null default 1,
  responses jsonb not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table assessments enable row level security;

create policy "Users can view own assessments"
  on assessments for select using (auth.uid() = user_id);

create policy "Users can insert own assessments"
  on assessments for insert with check (auth.uid() = user_id);

create policy "Users can update own assessments"
  on assessments for update using (auth.uid() = user_id);
