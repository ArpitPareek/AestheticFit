-- meal_logs: food intake tracking
create table meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id text references food_library on delete set null,
  food_name text not null,
  servings numeric not null default 1,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table meal_logs enable row level security;

create policy "Users can view own meal logs"
  on meal_logs for select using (auth.uid() = user_id);

create policy "Users can insert own meal logs"
  on meal_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own meal logs"
  on meal_logs for update using (auth.uid() = user_id);

create policy "Users can delete own meal logs"
  on meal_logs for delete using (auth.uid() = user_id);
