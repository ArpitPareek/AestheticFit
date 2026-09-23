-- 021_coach_plan_columns.sql
-- Storage-model columns for hand-authored (coach) multi-phase plans.
-- These live as TABLE COLUMNS, never inside plan_data — plan_data stays pure
-- ({version, phase, total_phases, days[...]}) so ProgressEngine/renderers can
-- rely on its shape. Idempotent: add column if not exists.
--
--   plan_source  distinguishes hand-authored coach plans from generated ones.
--                The Profile plan-selector filters on this. Existing rows
--                backfill to 'auto_generated' via the column default.
--   sort_order   1..N ordering for the selector / phase advancement.
--   phase_weeks  calendar length of THIS phase in weeks (mirrors the coach
--                calendar mapping; weeks_per_phase already exists but coach
--                phases have uneven lengths so this is the authoritative value).

alter table workout_plans
  add column if not exists plan_source text not null default 'auto_generated',
  add column if not exists sort_order  int,
  add column if not exists phase_weeks int;

-- Constrain plan_source to the two known sources (idempotent: drop+add).
alter table workout_plans drop constraint if exists workout_plans_plan_source_check;
alter table workout_plans add constraint workout_plans_plan_source_check
  check (plan_source in ('auto_generated', 'coach_authored'));

-- Query path for the selector: "coach plans for this user, in phase order".
create index if not exists workout_plans_user_source_sort_idx
  on workout_plans (user_id, plan_source, sort_order);
