# RLS Audit — AestheticFit

Generated: 2026-09-23. Re-run `scripts/check-rls.sql` after each schema change.

The anon key ships in the frontend bundle; RLS is the only wall between users.
Every app table must have RLS enabled and every user-owned row must be scoped to
`auth.uid()`. This audit documents all 22 tables.

---

## Legend
- ✅ Clean — RLS on, policies cover required operations with `auth.uid()` check  
- ⚠️  Gap — missing policy (document why below)
- ❌ CRITICAL — RLS off or policy missing `auth.uid()` scope

---

## User-Data Tables

### profiles
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = id`  
**No DELETE:** ✅ intentional (cascade from auth.users deletion handles cleanup)

### assessments
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = user_id`  
**No DELETE:** ✅ intentional (historical immutability; versioned via `version` column)

### workout_plans
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = user_id`  
**No DELETE:** ✅ intentional (historical immutability; deactivated via `is_active = false`)

### workout_logs
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = user_id`  
**No DELETE:** ✅ intentional (historical immutability; exercise logs reference these)

### exercise_logs
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = user_id`  
**No DELETE:** ✅ intentional (historical immutability; progress engine keys off these)

### meal_logs
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE, DELETE — all `auth.uid() = user_id`  
**Has DELETE:** ✅ users need to remove accidentally logged meals

### weight_logs
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = user_id`  
**No DELETE:** ⚠️ users cannot delete a wrong weigh-in entry; UNIQUE(user_id, log_date) means
they must UPDATE instead. Accepted: they can overwrite via update.

### skin_logs
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = user_id`  
**No DELETE:** ✅ intentional (routine check-offs are low-value historical data)

### skin_checkins
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = user_id`  
**No DELETE:** ⚠️ users cannot delete a wrong check-in. Migration 037 adds UNIQUE + UPSERT
so same-day writes update instead of duplicating. Accepted.

### daily_logs
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = user_id`  
**No DELETE:** ✅ intentional; UNIQUE(user_id, log_date) means users UPDATE existing rows

### streaks
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE — all `auth.uid() = user_id`  
**No DELETE:** ✅ intentional (streak counters are computed state, not user-deletable)

### cardio_logs
**RLS:** ✅ on  
**Policies:** ALL (SELECT/INSERT/UPDATE/DELETE) — `auth.uid() = user_id`  
**Has DELETE:** ✅ users can remove a session they logged in error

### nutrition_config
**RLS:** ✅ on  
**Policies:** ALL — `auth.uid() = user_id`

### tdee_estimates
**RLS:** ✅ on  
**Policies:** SELECT only — `auth.uid() = user_id`  
**Writes:** service role only (bypasses RLS). No INSERT/UPDATE policy for authenticated
users is intentional — the engine owns these rows.

### nutrition_targets
**RLS:** ✅ on  
**Policies:** ALL — `auth.uid() = user_id`

### nutrition_target_history
**RLS:** ✅ on  
**Policies:** SELECT — `auth.uid() = user_id`; INSERT limited to `source = 'manual'`  
**Engine writes:** via service role (bypasses RLS). Intentional.

### progress_photos
**RLS:** ✅ on  
**Policies:** SELECT, INSERT, UPDATE, DELETE — all `auth.uid() = user_id`  
**Storage RLS:** bucket `progress-photos` additionally enforces path prefix `uid/…`

### custom_foods
**RLS:** ✅ on  
**Policies:** ALL — `auth.uid() = user_id`

### recipe_ingredients
**RLS:** ✅ on  
**Policies:** ALL — scoped via parent `custom_foods.user_id = auth.uid()` join

### custom_exercises
**RLS:** ✅ on  
**Policies:** ALL — `auth.uid() = user_id`

---

## Shared Reference Tables (no user_id)

### exercise_library
**RLS:** ✅ on  
**Policies:** SELECT for authenticated — `true` (public read, service-role writes)

### food_library
**RLS:** ✅ on  
**Policies:** SELECT for authenticated — `true` (public read, service-role writes)

---

## Summary

| Category | Count |
|---|---|
| ✅ Clean | 22 |
| ⚠️  Accepted gaps (no DELETE, intentional) | 2 (weight_logs, skin_checkins) |
| ❌ CRITICAL | 0 |

**No critical gaps found.** Run `scripts/check-rls.sql` in the Supabase SQL editor to
confirm zero tables with RLS off in the live DB. Repeat after every migration.
