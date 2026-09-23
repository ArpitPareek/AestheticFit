-- 038_activate_plan_rpc.sql
-- Atomic plan activation: deactivates all user plans and activates the target
-- in a SINGLE UPDATE so there is never a window with 0 or 2 active plans.
--
-- SECURITY INVOKER: runs as the caller, so the existing RLS UPDATE policy
-- (auth.uid() = user_id) applies — it can only touch the caller's rows.
--
-- ROLLBACK:
--   drop function if exists activate_plan(uuid, uuid);

create or replace function activate_plan(p_user uuid, p_plan uuid)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or auth.uid() != p_user then
    raise exception 'unauthorized';
  end if;

  -- Atomic: set is_active = true only for the target, false for all others.
  update workout_plans
     set is_active = (id = p_plan)
   where user_id = p_user
     and (is_active = true or id = p_plan);

  select to_jsonb(wp) into v_result
    from workout_plans wp
   where id = p_plan and user_id = p_user;

  return v_result;
end;
$$;

grant execute on function activate_plan(uuid, uuid) to authenticated;
