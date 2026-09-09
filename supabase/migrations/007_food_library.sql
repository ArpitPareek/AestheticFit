-- food_library: shared reference data (no user_id)
create table food_library (
  id text primary key,
  name text not null,
  aliases text[] not null default '{}',
  category text not null,
  is_vegetarian boolean not null default false,
  serving_size text not null,
  serving_grams numeric not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  fiber_g numeric not null default 0,
  source text not null default 'manual' check (source in ('ifct', 'manual', 'estimated')),
  created_at timestamptz not null default now()
);

alter table food_library enable row level security;

-- Read-only for all authenticated users; writes require service role
create policy "Authenticated users can read foods"
  on food_library for select to authenticated using (true);
