-- 037_skin_checkins_unique.sql
-- Adds UNIQUE(user_id, checkin_date) to skin_checkins after de-duplicating any
-- same-day duplicates (keep the latest row per user+date).
--
-- ROLLBACK:
--   alter table skin_checkins drop constraint if exists skin_checkins_user_date_key;

-- Step 1: delete earlier duplicate rows, keeping the one with the latest created_at.
delete from skin_checkins
 where id not in (
   select distinct on (user_id, checkin_date) id
     from skin_checkins
    order by user_id, checkin_date, created_at desc
 );

-- Step 2: add the uniqueness constraint.
alter table skin_checkins
  add constraint skin_checkins_user_date_key unique (user_id, checkin_date);
