-- 026_advance_coach_phase.sql
-- Atomic, coach-aware phase advancement. The app never flips is_active with two
-- separate updates (that risks a window with 0 or 2 active plans — and 2 active
-- breaks ProfileContext's .maybeSingle()). Instead one statement sets
-- is_active = (id = target) across the user's active rows + the target, so there
-- is exactly one active plan at every instant.
--
-- SECURITY INVOKER: runs as the caller, so the existing RLS update policy
-- (auth.uid() = user_id) applies and it can only ever touch the caller's rows.
-- The new phase's start_date is set to the tap day (current_date) when it was
-- dormant (null), so its Week-1 counter starts when the athlete actually begins
-- it. Never auto-called — only invoked by an explicit "Start Phase N+1" tap.
--
-- Reversible:  drop function if exists advance_to_coach_phase(int);

create or replace function advance_to_coach_phase(target_phase int)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_uid    uuid := auth.uid();
  v_target uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select id into v_target
    from workout_plans
   where user_id = v_uid
     and plan_source = 'coach_authored'
     and phase = target_phase
   order by sort_order nulls last, created_at
   limit 1;

  if v_target is null then
    raise exception 'no coach_authored phase % for this user', target_phase;
  end if;

  update workout_plans
     set is_active  = (id = v_target),
         start_date = case when id = v_target then coalesce(start_date, current_date) else start_date end
   where user_id = v_uid
     and (is_active = true or id = v_target);

  return v_target;
end;
$$;

grant execute on function advance_to_coach_phase(int) to authenticated;
