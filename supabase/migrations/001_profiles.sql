-- profiles: core user profile data
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  age int,
  sex text check (sex in ('male', 'female')),
  height_cm numeric,
  current_weight_kg numeric,
  target_weight_kg numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
