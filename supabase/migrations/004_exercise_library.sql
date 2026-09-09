-- exercise_library: shared reference data (no user_id)
create table exercise_library (
  id text primary key,
  name text not null,
  primary_muscle text not null,
  secondary_muscles text[] not null default '{}',
  movement_pattern text not null check (movement_pattern in ('push', 'pull', 'hinge', 'squat', 'carry', 'isolation')),
  equipment text[] not null default '{}',
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  instructions text,
  form_cues text[] not null default '{}',
  common_mistakes text[] not null default '{}',
  youtube_search_url text,
  alternatives text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table exercise_library enable row level security;

-- Read-only for all authenticated users; writes require service role
create policy "Authenticated users can read exercises"
  on exercise_library for select to authenticated using (true);
