-- 027_body_tape.sql
-- Body-tape metrics that match the coach's "how to tell it's working" list:
--   A = waist (+ photos); B = waist + HIP + BUST tape monthly (+ photos).
-- weight_logs already has waist_cm; add hip and bust so the whole monthly tape
-- lives on the same weekly/daily row. Additive + reversible.
--
-- Rollback:  alter table weight_logs
--              drop column if exists hip_cm, drop column if exists bust_cm;

alter table weight_logs
  add column if not exists hip_cm  numeric,   -- hip circumference (B: hip-dip/glute shape)
  add column if not exists bust_cm numeric;   -- chest/bust tape (B: "perky" story is BF + pec, tracked here)
