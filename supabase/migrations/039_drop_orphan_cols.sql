-- 039_drop_orphan_cols.sql
-- Drops four columns from profiles that were superseded by the JSONB
-- nutrition_targets column. Confirmed: no live reads in src/ before applying.
--
-- ROLLBACK (if needed before any data matters):
--   alter table profiles
--     add column calorie_target int,
--     add column protein_target_g int,
--     add column carb_target_g    int,
--     add column fat_target_g     int;

alter table profiles
  drop column if exists calorie_target,
  drop column if exists protein_target_g,
  drop column if exists carb_target_g,
  drop column if exists fat_target_g;
