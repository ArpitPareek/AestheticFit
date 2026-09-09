-- skin_checkins: periodic skin condition assessments
create table skin_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  checkin_date date not null,
  texture_score int not null check (texture_score between 1 and 5),
  evenness_score int not null check (evenness_score between 1 and 5),
  hydration_score int not null check (hydration_score between 1 and 5),
  breakout_level text not null check (breakout_level in ('none', 'few', 'moderate', 'many')),
  notes text,
  created_at timestamptz not null default now()
);

alter table skin_checkins enable row level security;

create policy "Users can view own skin checkins"
  on skin_checkins for select using (auth.uid() = user_id);

create policy "Users can insert own skin checkins"
  on skin_checkins for insert with check (auth.uid() = user_id);

create policy "Users can update own skin checkins"
  on skin_checkins for update using (auth.uid() = user_id);
