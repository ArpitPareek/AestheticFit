# AestheticFit v5 — Pre-Departure Checklist

Last updated: 2026-09-26

---

## 1. Migration Run Order

Migrations 001–020 are already applied in production. Run **021–045** in order,
each as a single whole-file paste into the **Supabase SQL Editor** (Dashboard >
SQL Editor > New query > paste > Run). Do NOT split a file at `;` — several
contain dollar-quoted blocks that break naive splitters.

| # | File | What it does |
|---|------|-------------|
| 021 | `021_coach_plan_columns.sql` | Adds `plan_source`, `phase`, `total_phases`, `sort_order`, `phase_weeks`, `is_active`, `start_date` columns to `workout_plans`. |
| 022 | `022_coach_plan_exercises.sql` | Inserts 5 exercise_library rows referenced by coach plans but missing from migration 020. |
| 023 | `023_coach_plans_seed.sql` | Seeds 8 coach-authored plan rows (A/B x phases 1-4), all `is_active=false`. Large dollar-quoted JSON — paste the whole file. |
| 024 | `024_coach_go_live.sql` | Activates each user's coach Phase 1 and deactivates prior plans. |
| 025 | `025_ladder_metrics.sql` | Adds `ladder_assist_kg`, `ladder_surface_level` to `exercise_logs` and `assist_kg`/`surface_level` to ExerciseSet jsonb shape. |
| 026 | `026_advance_coach_phase.sql` | Creates `advance_to_coach_phase()` RPC for atomic single-active phase flip. |
| 027 | `027_body_tape.sql` | Adds `hip_cm`, `bust_cm` nullable columns to `weight_logs`. |
| 028 | `028_progress_photos.sql` | Creates `progress_photos` table + private storage bucket with RLS. |
| 029 | `029_prehab_skipped.sql` | Adds `prehab_skipped` boolean column to `workout_logs`. |
| 030 | `030_cardio_logs.sql` | Creates `cardio_logs` table with RLS. |
| 031 | `031_fix_nutrition_targets.sql` | Corrects protein/calorie config values for both users. |
| 032 | `032_fix_plan_start_date.sql` | Corrects Phase-1 `start_date` from 2026-09-23 to 2026-09-24 for both users. |
| 033 | `033_rls_hardening.sql` | Belt-and-suspenders: ensures RLS is active on every app table. |
| 034 | `034_rate_limiter.sql` | Per-user, per-bucket rate-limiting table for Edge Functions. |
| 035 | `035_date_repair.sql` | One-time repair for rows logged 00:00–05:30 IST stored under the wrong local date. |
| 036 | `036_meal_food_id.sql` | Ensures `meal_logs.food_id` (nullable FK → `food_library`) exists. |
| 037 | `037_skin_checkins_unique.sql` | De-dupes then adds `UNIQUE(user_id, checkin_date)` to `skin_checkins`. |
| 038 | `038_activate_plan_rpc.sql` | Atomic plan-activation RPC (deactivate all, activate target). |
| 039 | `039_drop_orphan_cols.sql` | Drops four `profiles` columns superseded by the JSONB assessment shape. |
| 040 | `040_indexes.sql` | Indexes on hot-path queries (per-table primary access pattern). |
| 041 | `041_food_data.sql` | F1 — food data foundations: portion conversions, alias table, shared helpers. |
| 042 | `042_food_id_backfill.sql` | B2b — backfills historical `meal_logs.food_id` against `food_library`. |
| 043 | `043_food_match_fn.sql` | F2 support — trigram fuzzy-match RPC for the parse-meal edge function. |
| 044 | `044_cardio_logs_robust.sql` | Adds `activity_key`, `distance_km`, `calories`, `calories_source`, `rpe` to `cardio_logs` (MET-based estimation + distance/pace + RPE). |
| 045 | `045_session_prep_logs.sql` | Creates `session_prep_logs` table + RLS for warm-up/stretch check-off tracking. |

**Rollback**: every migration has rollback SQL in a header comment. To undo,
copy the rollback block and run it in the SQL Editor.

**Verification after running all migrations**:
```sql
-- Should return 8 rows: 2 active (phase 1), 6 dormant
SELECT user_id, plan_name, phase, is_active, plan_source
FROM workout_plans
WHERE plan_source = 'coach_authored'
ORDER BY user_id, phase;
```

---

## 2. Redeploy (Vercel)

The project auto-deploys on push to `main` via the Vercel GitHub integration.

**Manual redeploy** (if needed):
1. Push your changes to `main`: `git push origin main`
2. Vercel picks it up automatically (build command: `tsc -b && vite build`).
3. If the auto-deploy is disconnected, from the project root:
   ```bash
   npm run build          # verify locally first
   npx vercel --prod      # deploy to production (requires Vercel CLI + auth)
   ```

**Environment variables** (already set in Vercel dashboard):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

No `vercel.json` is needed — Vite's default SPA config works.

---

## 3. Per-User Smoke Tests

### Person A (Arpit) — recomp, V-taper, neck-safe

User ID: `be213280-323e-40f8-a6f5-3f6c1f84a92b`

1. **Log in** with A's credentials.
2. **Workouts tab** — verify header shows:
   - "Plan · Phase 1 of 4 · Week W" (W = correct week since start_date).
   - Day label matches today's preferred weekday schedule.
3. **Log a session**:
   - **Warm-up card** (above exercises) → check off items in order; the done/total badge updates and the state survives a reload (persisted to `session_prep_logs`).
   - Expand any exercise card → verify the demo animates between the two frames (0.jpg/1.jpg) and the "Watch on YouTube" link opens a search/video.
   - Log 3 sets of an exercise (e.g. 60kg x 10 x RIR2) → tap "Save sets" → green checkmark count updates.
   - **Cool-down / stretch card** (below exercises) → check off a stretch; verify it persists.
   - **Swap test**: expand another exercise → "Swap exercise" → pick an alternative → select a reason → log sets → save.
   - Verify face-pull or reverse-fly prehab card is present (mandatory for A).
   - Tap "Finish workout" **without** logging prehab → amber "Prehab not logged" warning appears. Tap "Go back and log" → log prehab → "Finish workout" → green summary card.
4. **Reopen Workouts tab** (navigate away and back):
   - All saved exercises show the green checkmark count.
   - The **swapped** exercise card opens on the swapped-to exercise (not the original). Badge says "swapped".
5. **Track tab**:
   - Weight/tape: enter today's weight + waist. For A, hip/bust fields may be hidden or optional — that's correct.
   - 28-day moving average readout appears once enough data exists.
   - Lift progress: shows est-1RM chart for logged lifts (may be empty if first session).
   - **Cardio**: "Log cardio session" → pick an activity (e.g. Cricket) → calories auto-estimate from bodyweight × MET; for a walk/run/cycle, distance shows a min/km pace; RPE sets intensity; a device number can override the estimate; backdating to a recent day works.
   - Photo reminder: if 4+ weeks since last photo, a nudge is visible.
6. **Phase-advance banner** (only when phase_weeks are exhausted):
   - When the phase's weeks have elapsed, a persistent amber banner appears at the top: "Phase 1 complete — ready to advance?"
   - Tap → confirmation prompt → tap again → phase flips to 2, plan reloads.
   - **Safe backdate + revert** (run in SQL Editor if needed):
     ```sql
     -- Revert A back to Phase 1 (undo an accidental advance)
     SELECT advance_to_coach_phase(
       'be213280-323e-40f8-a6f5-3f6c1f84a92b',
       (SELECT id FROM workout_plans
        WHERE user_id = 'be213280-323e-40f8-a6f5-3f6c1f84a92b'
          AND plan_source = 'coach_authored' AND phase = 1)
     );
     ```
7. **Logout**: Profile tab → "Log out" → returns to login screen.

### Person B (Harshita) — managed cut, glute/hip, wedding peak

User ID: `be5d8bf5-ca0f-4897-8d41-62b2d2c72b52`

1. **Log in** with B's credentials.
2. **Workouts tab** — verify header shows Phase 1 of 4, correct week.
3. **Log a session**:
   - Find an assisted-pull-up card → it should show **ladder mode** (assist-kg input, blue "Ladder" banner explaining assist should DROP).
   - Log e.g. 25kg assist x 8 reps x RIR2 → save → green arrow if lower than last session.
   - Find an incline-push-up card → surface dropdown (Wall / High bar / Bench / Low box / Floor) instead of weight input. Log a set.
   - **Swap test**: swap a non-ladder exercise → log → save.
   - Finish the session.
4. **Reopen Workouts tab**:
   - Ladder sets show the correct assist_kg / surface values.
   - Swapped exercise re-surfaces on its swapped-to card.
5. **Track tab**:
   - Weight/tape: enter weight + waist + **hip** + **bust** (B has all four tape fields).
   - 28-day cycle-smoothed weight readout.
   - Lift progress (est-1RM per lift).
   - Photo reminder.
6. **Phase-advance banner**: same behavior as A.
   - **Revert SQL for B**:
     ```sql
     SELECT advance_to_coach_phase(
       'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52',
       (SELECT id FROM workout_plans
        WHERE user_id = 'be5d8bf5-ca0f-4897-8d41-62b2d2c72b52'
          AND plan_source = 'coach_authored' AND phase = 1)
     );
     ```
7. **Logout**.

---

## 4. Manual Fallback — If Something Breaks

The top priority is: **no data is lost and nothing misleads**.

### If the app won't load or shows a white screen
- Check the Vercel deployment logs (Vercel dashboard > Deployments > latest).
- Locally: `npm run build` to reproduce build errors.
- **User action**: stop using the app until it's fixed. No data is at risk — it's all in Supabase.

### If a workout session won't save (sets disappear on tap)
- Open browser DevTools > Network tab — look for failed Supabase requests (4xx/5xx).
- Check Supabase Dashboard > Logs > Edge Functions or API logs.
- **User action**: note the exercises/sets on paper or Notes app. They can be manually inserted later:
  ```sql
  -- Manual exercise log insert (replace values)
  INSERT INTO exercise_logs (user_id, workout_log_id, exercise_id, exercise_name, order_index, sets)
  VALUES ('<user_id>', '<log_id>', '<exercise_id>', '<name>', 0,
    '[{"set_number":1,"weight_kg":60,"reps":10,"rir":2}]'::jsonb);
  ```

### If the wrong phase is active (or two plans are active)
- This should never happen with the atomic RPC, but if it does:
  ```sql
  -- Check current state
  SELECT id, plan_name, phase, is_active FROM workout_plans
  WHERE user_id = '<user_id>' AND plan_source = 'coach_authored'
  ORDER BY phase;

  -- Fix: activate exactly one phase
  UPDATE workout_plans SET is_active = false
  WHERE user_id = '<user_id>' AND plan_source = 'coach_authored';

  UPDATE workout_plans SET is_active = true
  WHERE user_id = '<user_id>' AND plan_source = 'coach_authored' AND phase = <correct_phase>;
  ```

### If weight/tape data looks wrong
- Data is in `weight_logs`. Query to inspect:
  ```sql
  SELECT * FROM weight_logs
  WHERE user_id = '<user_id>'
  ORDER BY logged_at DESC LIMIT 10;
  ```
- To delete an accidental entry: `DELETE FROM weight_logs WHERE id = '<row_id>';`

### If nutrition targets seem off
- Check `nutrition_config` and `nutrition_targets` for the user:
  ```sql
  SELECT * FROM nutrition_config WHERE user_id = '<user_id>';
  SELECT * FROM nutrition_targets WHERE user_id = '<user_id>';
  ```
- Migration 031 has the corrected values — re-run it if needed.

### General rule for both users
- **Don't delete workout_logs or exercise_logs** — they are historical and immutable.
- If something displays wrong, the data is almost certainly fine in the DB. The display bug can be fixed in code without data loss.
- Screenshots of any weird behavior help enormously for debugging later.

---

## 5. What Could Not Be Verified Live

- **Auth flow**: login/logout cycle was not tested against the live Supabase Auth instance in this session. The code paths are straightforward (supabase.auth.signInWithPassword / signOut) but should be confirmed with real credentials.
- **Phase advancement RPC**: the `advance_to_coach_phase()` function was verified at the SQL level (migration 026) but not exercised through the UI with a real phase-exhausted state. The revert SQL above is the safety net.
- **Photo storage**: progress_photos bucket and signed-URL flow (migration 028) were not tested end-to-end. Photo capture is a nice-to-have, not blocking.
- **Offline/PWA**: service worker caching is configured but not tested with airplane mode. Core logging may fail silently if offline — the user should see a network error and retry when connected.
- **28-day moving average**: requires ~28 days of weight data to be meaningful. The view (`weight_trend`) was verified at schema level but not with production data volume.
