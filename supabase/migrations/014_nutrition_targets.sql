-- Add nutrition target columns to profiles
alter table profiles
  add column if not exists calorie_target numeric,
  add column if not exists protein_target_g numeric,
  add column if not exists carb_target_g numeric,
  add column if not exists fat_target_g numeric;
