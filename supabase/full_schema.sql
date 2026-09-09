-- ============================================
-- AestheticFit: Complete Database Schema
-- Paste this entire file into Supabase SQL Editor
-- ============================================

-- -------- 001_profiles.sql --------
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


-- -------- 002_assessments.sql --------
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


-- -------- 003_workout_plans.sql --------
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


-- -------- 004_exercise_library.sql --------
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


-- -------- 005_workout_logs.sql --------
-- workout_logs: per-session workout records
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  plan_id uuid references workout_plans on delete set null,
  plan_version int,
  workout_date date not null,
  day_label text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table workout_logs enable row level security;

create policy "Users can view own workout logs"
  on workout_logs for select using (auth.uid() = user_id);

create policy "Users can insert own workout logs"
  on workout_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own workout logs"
  on workout_logs for update using (auth.uid() = user_id);


-- -------- 006_exercise_logs.sql --------
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


-- -------- 007_food_library.sql --------
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


-- -------- 008_meal_logs.sql --------
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


-- -------- 009_weight_logs.sql --------
-- weight_logs: daily weigh-ins
create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  weight_kg numeric not null,
  waist_cm numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table weight_logs enable row level security;

create policy "Users can view own weight logs"
  on weight_logs for select using (auth.uid() = user_id);

create policy "Users can insert own weight logs"
  on weight_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own weight logs"
  on weight_logs for update using (auth.uid() = user_id);


-- -------- 010_skin_logs.sql --------
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


-- -------- 011_skin_checkins.sql --------
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


-- -------- 012_daily_logs.sql --------
-- daily_logs: steps, sleep, water tracking
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  steps int,
  sleep_hours numeric,
  water_glasses int,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table daily_logs enable row level security;

create policy "Users can view own daily logs"
  on daily_logs for select using (auth.uid() = user_id);

create policy "Users can insert own daily logs"
  on daily_logs for insert with check (auth.uid() = user_id);

create policy "Users can update own daily logs"
  on daily_logs for update using (auth.uid() = user_id);


-- -------- 013_streaks.sql --------
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


