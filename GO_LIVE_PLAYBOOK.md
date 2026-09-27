# AestheticFit — Go-Live Playbook

**Deadline:** Sunday 2026-09-27 night
**Today:** Saturday 2026-09-26 (~30 hours available)
**Users:** Arpit + Harshita (2 users, personal PWA)
**Rule:** every pre-go-live batch is data-integrity or safety. Product features ship AFTER Sunday.

---

## Master inventory (findings + features)

### 🔴 CRITICAL bugs (block go-live)

**Nutrition — portion/unit math (the "5 almonds = 500g" family)**
- B01 `parse-meal/index.ts:361-364` — `quantity × food.serving_grams` when unit is `piece/tsp/tbsp/handful` and no `portion_conversions` row → nuts, oils, biscuits, dates, grapes, chocolate all over-report by 10-100×
- B02 `toor-dal` ID collision — `seed-food-staples.sql:16` (dry, 343 kcal/100g) vs `seed-foods.sql:6` (cooked, 150 kcal/200g) — same id, last seed wins. "1 katori dal" currently ~514 kcal instead of ~158
- B03 `parse-meal/index.ts:349` — ml treated as 1:1 g for oil (0.92) / honey (1.42) / condensed milk
- B04 `parse-meal/index.ts:231` — AI `estimated_grams` clamped 1-2000 with no per-unit ceiling → "1 slice pizza" can log as 2kg
- B05 `parse-meal/index.ts:380` — `FUZZY_MIN_SIMILARITY = 0.3` too low; `chai`↔`chia`, `almond`(IFCT)↔`almonds`(everyday)
- B06 `parse-meal/index.ts:183-196` — `sanitizePer100g` allows P+C+F > 100g; also accepts calories>20 when Atwater=0
- B07 `parse-meal/index.ts:449-492` — `decompose()` accepts 0.3 fuzzy hits into 80% mass ratio and silently drops unmatched 20%
- B08 IFCT seed rows (~300) have zero `portion_conversions` — every one is a latent almond bug

**Workout — safety and correctness**
- B09 `warmupStretch.ts:131-140` — regex matcher order: `Lower B + Delts` matches `/delt/` before `/leg/` → squat days get arm-circle warm-up. INJURY RISK.
- B10 `useWorkoutLogger.ts:239-272` — "Finish anyway" saves `completed_at` with 0 exercise_logs → streak ticks, dashboard shows ✓
- B11 `006_exercise_logs.sql:11` — UPDATE policy unconditional; `plan_version` hardcoded to `1` in `useWorkoutLogger.ts:106`; no `plan_version_id` FK. Historical logs mutable, violating CLAUDE.md
- B12 `planGenerator.ts:107, 187` — `start_date` written as UTC `.toISOString()` → plans activated after 6:30 PM IST start "tomorrow"
- B13 `SessionExerciseCard.tsx:190-197` — 0kg silently accepted; blank weight = `Number('')` = 0; progress engine then recommends "add 2.5kg"
- B14 `SessionExerciseCard.tsx:188` — RIR 20 saved without warning; recovery detector never trips
- B15 `useExerciseHistory.ts:24-30` — orders by `created_at DESC` so today's just-saved sets become "last session"; mid-workout recommendation says "add load" after top-of-range
- B16 `SessionExerciseCard.tsx:60-65` — prehab check reads `slot.ref.id` after swap → "prehab not logged" modal fires forever after any swap; user forced onto "Finish anyway" → see B10

**Systemic — UTC vs local date (affects streaks, skin, cardio, weight, meals)**
- B17 `Dashboard.tsx:156` — streak-record uses UTC; writes use local → **streak silently stalls every day between 00:00–05:30 IST**
- B18 `SkinRoutine.tsx:210-218` — mixes local `getDay()` with UTC `toISOString()` → late-night IST users tap Tue, save to Mon
- B19 `useDailyNutrition.ts:46` — `todayRef` captured at mount → meals logged past midnight go to yesterday
- B20 Every "today" hook captures date at mount: `useDashboardData`, `useStreaks`, `useDailyLogs`, `useCardioLogs`, `useDailyNutrition` — app left open across midnight = data corruption
- B21 `WeightTracker.tsx:247-249`, `WeightChart.tsx:31` — trend/goal cutoffs use UTC
- B22 `useRecoveryWatch.ts:14` — same UTC bug
- B23 `PhotoReminder.tsx:14-21`, `ProfilePage.tsx:176-178` — wedding countdown parses `YYYY-MM-DD` as UTC → off-by-one

**Race conditions / idempotency (silent duplicates or lost writes)**
- B24 `skin_logs` no unique(user_id, log_date, routine_type); client find-then-insert races → duplicate rows silently
- B25 `streaks` no unique(user_id, streak_type); double-mount inserts twice → `maybeSingle()` then throws
- B26 `weight_logs` upsert is client find-then-insert → double-tap surfaces raw Postgres 23505
- B27 `daily_logs` same — 5 rapid water-taps = 1 water + 4 error toasts
- B28 `addMeals` no idempotency key → network retry double-logs entire meal
- B29 `custom_foods` no unique(user_id, lower(name)); parallel `promoteAiFood` races

**Trust surfaces (silent failure of user actions)**
- B30 `useDashboardData.ts:67-71` — skin AM/PM "Done" fires after 1/5 steps because only toggled keys are stored + `every(Boolean)` on empty-ish subset
- B31 `ProfilePage.tsx:60-69` — Retake Assessment passes no `existingData` → walking through without re-entering wipes profile / crashes on NOT NULL
- B32 `AssessmentForm.tsx` — no field validation; age 500, height 5cm, empty display_name all pass
- B33 `ProfilePage.tsx:150-158` — Import silently succeeds with 0 rows on RLS reject; user sees green "Imported 0 records successfully"
- B34 `vite.config.ts` — service worker `NetworkFirst` on Supabase serves cached data after writes → user thinks weight didn't save
- B35 No offline write queue despite CLAUDE.md claim
- B36 `ErrorBoundary.tsx` catches only render errors; every Supabase `error` dropped on floor → transient 500 shows "No weight data yet"
- B37 No undo on any log (meal, workout, weight) — one-tap destructive
- B38 `MealLogger.tsx` — freezes `today` via `useRef` at mount, no backdate UI; forgetting to log breakfast then reopening at night = lost data

### 🟠 HIGH bugs (fix pre-go-live if time, otherwise week 1)

- B39 Contraindication filter doesn't apply to coach plans; substring matcher misses "impingement"/"back pain"
- B40 `ProgressEngine` deload never fires for generator plans; `deloadWeek` in templates unused
- B41 `ai_food_estimates` shared-global (no user_id) — one user's bad estimate served to the other forever
- B42 Progress-photo signed URLs expire 5min silently
- B43 Photo compression fallback returns raw file → 12MP JPEGs > 10MB fail with generic error; no HEIC handling
- B44 Nutrition targets never recompute on weight change (up to 7 days stale)
- B45 Composed-dish display grams stay stale on ingredient edit (macros change but "≈150g" header doesn't)
- B46 Cardio Zone-2 counted for non-Z2 activities (spin/HIIT/cricket allow Z2 tag)
- B47 `checkTodayActivity` treats water alone as workout day → trivially fake streaks
- B48 `AppShell` A2HS never handles iOS or `standalone`; installed users still see install banner
- B49 `usesTretinoin` hardcoded to `sex==='female' ? week>=3 : true` — male non-tret users see purge warning
- B50 `getRoutineForProfile` keyed on `sex` — Harshita's specific product list forced on any female user

### 🟡 MEDIUM (post-launch)
30+ items: `normalizeUnit` misses tablespoon/slice/handful, dashboard `getWeekNumber` uncapped, wedding date localStorage-only, weight-log no DELETE UI, export missing progress_photos/cardio_logs/custom_foods, plate math absent, ad-hoc exercise can't be logged, `preferenceScore` ignores "mixed" default, recovery detector false-positives during deloads, `advanceToNextPhase` non-atomic. See audit outputs.

### ✨ FEATURES (post-launch, ranked)

**NOW tier (Week 1 after launch):**
- F01 Partner card on dashboard ("Harshita: 3/4 workouts, 105g protein")
- F02 Repeat-yesterday / one-tap meal from history
- F03 PR celebration on set save (e1RM already computed)
- F04 Weekly recap card (Sun night / Mon morning)
- F05 Streak freeze / 1 grace day per week
- F06 "Fix and remember" for parsed meals
- F07 Backdated meal logging
- F08 Undo-last-action toast (meals + workouts)
- F09 Water tile on dashboard (already fetched, unused)
- F10 Wedding date on `profiles` (currently localStorage-only)

**NEXT tier (weeks 2-6):**
- F11 Cycle tracking for Harshita + training/nutrition awareness
- F12 Adherence heatmap (GitHub-style grid per pillar)
- F13 Skin photo capture + timeline (reuse `progress_photos` bucket)
- F14 Nutrition-target change history + explainer
- F15 Shared shopping list from planned meals
- F16 Push notifications (07:00 weigh-in, 21:00 protein-gap)
- F17 Restaurant / eating-out toggle in parse-meal
- F18 Guardrails: too-aggressive cut / low-protein streak alert
- F19 Deload / sickness / travel mode
- F20 Side-by-side weight chart (both partners)

**LATER tier:**
- F21 Leaderboard between partners
- F22 Bodyweight-vs-strength correlation view
- F23 "Your best days ate X protein / slept Y hrs" insights
- F24 Skincare product reorder reminders
- F25 Data-export versioning + audit log
- F26 Ad-hoc / substitute exercise logging (`is_ad_hoc` column exists)

---

## Batch plan — execution order

Batches 0-6 MUST ship before Sunday night. Each batch is one deploy. Do NOT interleave; verify after each.

### Batch 0 — Schema & seed fixes (foundation)
**Model:** Opus 4.7 · **Est tokens:** 30k · **Time:** 2h · **Runs in:** Supabase SQL editor + local repo

Migrations to author + run (in order):
1. `047_toor_dal_split.sql` — rename dry row → `toor-dal-raw`, repoint aliases in `food_aliases`, repoint `portion_conversions('toor-dal',...)` rows, verify with SELECT
2. `048_dedup_food_names.sql` — merge duplicate `food_library.name` rows (Moong Dal, Paneer Bhurji, Butter chicken, Rajma, Chole); add `unique(lower(name))` partial constraint
3. `049_portion_conversions_seed.sql` — add tsp=5g / tbsp=15g rows for every oil + honey/syrup; piece rows for almond (1.2g), cashew (1.5g), walnut (4g), pistachio (0.7g), raisin (0.5g), date (8g), grape (5g), biscuit (8g), roti (30g), egg (50g)
4. `050_unique_constraints.sql` — `skin_logs.unique(user_id, log_date, routine_type)`, `streaks.unique(user_id, streak_type)`, `weight_logs.unique(user_id, log_date)` (verify exists), `daily_logs.unique(user_id, log_date)`, `custom_foods.unique(user_id, lower(name)) where deleted_at is null`, `meal_logs` add `dedupe_key uuid` + `unique(user_id, dedupe_key)`
5. `051_ai_food_estimates_user_id.sql` — add `user_id`, backfill NULL, drop `unique(normalized_name)`, add `unique(user_id, normalized_name)` (or keep global but write-restricted to service_role)
6. `052_historical_log_immutability.sql` — UPDATE policy on `exercise_logs` / `workout_logs` restricted to `workout_date >= current_date - interval '1 day'`; add `plan_version_id uuid references workout_plans(id)` to `workout_logs`
7. `053_weight_log_delete_policy.sql` — DELETE policy for weight_logs (needed for undo)
8. `054_wedding_date_column.sql` — add `wedding_date date` to `profiles`

**Verification:** run `check-rls.sql`; SELECT count from each table before/after; smoke-test that current app still loads.

**⚠ Prod caveat:** the toor-dal repoint changes historical macros for past `meal_logs` that reference `toor-dal` via alias — but the meal rows store computed macros as columns (not references), so past logs are frozen. Verify this before running.

---

### Batch 1 — Nutrition portion/unit math (parse-meal edge function)
**Model:** Opus 4.7 · **Est tokens:** 40k · **Time:** 2-3h · **Depends on:** Batch 0

Files:
- `supabase/functions/parse-meal/index.ts`

Changes:
1. **Fix B01 almond family** — in `gramsForMatchedFood`, when unit is `piece/tsp/tbsp/handful/scoop/serving` AND no `portion_conversions` row exists AND `serving_grams == 100`, prefer `min(fallbackGrams, quantity × 20)` over `quantity × serving_grams`. Emit `portion_uncalibrated:{name}:{unit}` warning.
2. **Fix B03 ml=g** — density lookup for oils (0.92), honey (1.42), syrup (1.3); default 1.0 for aqueous
3. **Fix B04 estimated_grams ceilings** — per-unit cap: piece≤300, tsp≤15, tbsp≤30, glass≤500, cup≤400, katori≤250, plate≤600
4. **Fix B05 fuzzy threshold** — bump `FUZZY_MIN_SIMILARITY` to 0.55; add `almond`↔`almonds` alias in migration
5. **Fix B06 sanitizePer100g** — require `P+C+F ≤ 100`, proportionally scale down if over; if `Atwater < 10` AND calories > 20 → force calories = Atwater
6. **Fix B07 decompose** — require fuzzy ≥ 0.6 to count toward `matchedGrams`; blend AI per-100g for unmatched fraction rather than dropping it
7. **Expand `UNIT_ALIASES`** — tablespoon, teaspoon, slice, slices, medium, large, small, handful, scoop, serving, cups
8. **Prefer AI estimated_grams over serving-scale fallback** for household units without calibration (this is the general form of #1)

**Verification (golden parses):**
- "5 soaked almonds" → grams 5-10, calories <60
- "1 tsp olive oil" → grams ~5, calories <50
- "1 katori dal" → 130-200 cal, 6-12g protein
- "2 rotis, 1 katori sabzi, 1 chai" → 3 items, sensible totals
- "chia pudding" → does NOT match `chai`

Deploy: paste into Supabase dashboard function editor (per file header).

---

### Batch 2 — UTC → local date grep-and-replace (systemic)
**Model:** Sonnet 5 · **Est tokens:** 25k · **Time:** 1-2h · **Depends on:** Batch 0

Files (grep `toISOString().slice(0, 10)` across `src/`):
- `src/features/dashboard/Dashboard.tsx:156`
- `src/features/dashboard/useDashboardData.ts` (any date captures)
- `src/features/dashboard/useStreaks.ts`
- `src/features/workout/planGenerator.ts:107, 187`
- `src/features/skin/SkinRoutine.tsx:210-218`
- `src/features/nutrition/hooks/useDailyNutrition.ts:46` (`todayRef`)
- `src/features/tracking/hooks/useDailyLogs.ts:20`
- `src/features/tracking/hooks/useCardioLogs.ts:52`
- `src/features/tracking/RecoveryWatch.tsx` / `useRecoveryWatch.ts:14`
- `src/features/weight/WeightTracker.tsx:247-249, 294`
- `src/features/weight/WeightChart.tsx:31`
- `src/features/tracking/PhotoReminder.tsx:14-21`
- `src/features/profile/ProfilePage.tsx:125, 176-178`

Changes:
1. Replace all `.toISOString().slice(0,10)` with `localTodayISO()` from `src/lib/utils.ts`
2. Add `localDateISO(date: Date)` helper if it doesn't exist; use in trend/chart cutoffs and week-boundary code
3. Wrap `useDailyNutrition`, `useDashboardData`, `useStreaks`, `useDailyLogs`, `useCardioLogs` to recompute `today` on `visibilitychange` event AND when local date rolls over (`setInterval` checking hour, or listen for `focus`)
4. Fix `SkinRoutine.getSelectedDate` — build from local components, don't roundtrip via `toISOString`
5. Fix wedding countdown parsing — use `new Date(str + 'T00:00:00')` for local midnight

**Verification:**
- Set device time to 00:15 IST, log a meal → confirm goes to correct local date
- Set device time to 23:55 IST, log a meal → confirm goes to correct local date
- Streak recorded at 03:00 IST is visible on dashboard

---

### Batch 3 — Race conditions / idempotency (client hooks)
**Model:** Sonnet 5 · **Est tokens:** 25k · **Time:** 2h · **Depends on:** Batch 0

Files:
- `src/features/skin/hooks/useSkinLogs.ts:35-60` → `.upsert({...}, { onConflict: 'user_id,log_date,routine_type' })`
- `src/features/dashboard/useStreaks.ts:62-107` → upsert
- `src/features/weight/hooks/useWeightLogs.ts:33-61` → upsert; drop client find
- `src/features/tracking/hooks/useDailyLogs.ts:37-60` → upsert; also debounce water increment 300ms client-side
- `src/features/nutrition/hooks/useDailyNutrition.ts:105-125` → generate `dedupe_key` uuid per parse batch, pass in `addMeals`, insert with `on conflict do nothing`
- `src/features/nutrition/promoteAiFood.ts:52-89` → upsert with `onConflict: 'user_id,lower(name)'`

**Verification:**
- Double-tap "Log Weight" → 1 row, no error
- 5 rapid water-taps → count = 5
- Retry a parse batch (simulate network fail then success) → 1 row per item, not 2

---

### Batch 4 — Workout safety
**Model:** Opus 4.7 · **Est tokens:** 35k · **Time:** 2-3h · **Depends on:** Batch 0

Files:
- `src/lib/constants/warmupStretch.ts:131-140`
- `src/features/workout/hooks/useWorkoutLogger.ts:106, 239-272`
- `src/features/workout/hooks/useExerciseHistory.ts:24-30`
- `src/features/workout/planGenerator.ts:107, 187` (already touched in Batch 2, but verify)
- `src/features/workout/SessionExerciseCard.tsx:60-65, 188, 190-197`
- `src/features/workout/ProgressEngine.ts:125-131`

Changes:
1. **B09** — reorder warm-up matcher regex: `lower|leg|quad|squat|hinge|hip|glute|ham` BEFORE `delt|arm|core|abs`; add explicit label→routine map for coach plan phase labels
2. **B10** — `finishWorkout` blocks `completed_at` unless ≥1 exercise_log row exists for this session
3. **B11** — `plan_version_id` populated from active `workout_plans.id` (not hardcoded 1); RLS handled in Batch 0
4. **B13** — reject save if any set has `weight === '' || weight === null` AND exercise is not bodyweight/ladder; show warning modal
5. **B14** — clamp RIR to `0-5` at save; warn if outside
6. **B15** — `useExerciseHistory` excludes rows where `workout_date >= today`
7. **B16** — prehab check reads `activeId` (post-swap), not `slot.ref.id`
8. **B03** deload weight for `lastWeight === 0` — short-circuit to rep-progression path
9. Contraindications on coach plans (B39) — cross-check `slot.ref.id` and alternatives against user's `injuryTags` in `SessionExerciseCard`

**Verification:**
- Open coach "Lower B + Delts" → warm-up shows leg swings + squat ramp
- Try "Finish anyway" with no sets logged → blocked
- Save top-of-range on bench → reopen card → recommendation still shows yesterday's session, not today's
- Save set with blank weight → warning fires
- Enter RIR 20 → clamped to 5 + warning
- Swap face-pulls → save sets → finish → no "prehab not logged" modal

---

### Batch 5 — Trust surfaces ✅ SHIPPED (partial)
**Model:** Sonnet 5 · **Status:** deployed with 3 items deferred

**Shipped:**
1. ✅ **B30** — skin done: requires all expected step ids present + true; delete key on uncheck
2. ✅ **B31** — Retake Assessment prefills `existingData`; profile upsert gated on non-null values
3. ✅ **B32** — per-step `canAdvance` validators (age 10-100, height 100-230, weight 30-250, display_name, sex)
4. ✅ **B33** — Import: error per-table surfaced, forces `user_id = user.id`
5. ✅ **B36** — ErrorBoundary + `window.unhandledrejection` in `main.tsx`; local toasts on Supabase errors (lighter approach — no full interceptor in `supabase.ts`)
6. ✅ **B37 (meal only)** — 5-sec undo toast on meal delete
7. ✅ **B34** — service worker: mutating paths → `NetworkOnly`; update banner

**Deferred to post-launch:**
- ❌ **B38** — backdated meal date picker: `useDailyNutrition` needs a `targetDate` param; wider refactor than batch budget. Risk limited — draft-persistence survives midnight.
- ❌ **B37 (workout)** — workout-finish undo needs `deleted_at`/`is_undone` on `workout_logs`; schema not in place. Meal undo is live.
- ❌ **Shared toast context in `supabase.ts`** — went with lighter `main.tsx` global rejection surface; full interceptor is post-launch.

**Deferred item IDs for post-launch backlog:** B38, B37-workout, B36-interceptor

**Verification (adjusted for what shipped):**
- Skin: check 1 step → dashboard shows step-count / "In progress", NOT "Done" ✓
- Retake Assessment → form prefilled ✓
- Empty display_name → blocked ✓
- Import wrong file → red toast with count ✓
- Transient network error → red toast ✓
- Delete a meal → 5-sec undo toast → tap → meal restored ✓
- ~~Backdate a meal~~ — NOT testable (deferred)
- ~~Workout undo~~ — NOT testable (deferred)

---

### Batch 6 — Deploy, E2E test, hotfix
**Model:** Opus 4.7 (for hotfix judgment) · **Est tokens:** 40k · **Time:** 4-6h · **Depends on:** Batches 0-5

Steps:
1. `npm run build` + preview locally → smoke test the golden paths
2. Deploy to Vercel; deploy `parse-meal` function; run all pending migrations in Supabase SQL editor in order
3. Run E2E test plan (below) with both user credentials
4. Log every regression to `HOTFIX_LOG.md`; triage into ship-tonight vs post-launch
5. Ship hotfixes; re-run affected test scenarios

---

## E2E product test plan

**When:** Sunday morning after Batches 0-5 land in staging
**Duration:** ~2 hours per user × 2 users = 4 hours
**Credentials:** paste both users' passwords into a local `.test-creds` file (git-ignored); never into chat prompts. Test in an incognito window per user to avoid session bleed.

Test in this exact order per user:

**Data isolation (do first — abort if this fails)**
- [ ] Log in as User A → note last 3 meals + last workout + latest weight
- [ ] Log out, log in as User B → confirm zero visibility of User A's data across every screen
- [ ] SQL check: `select count(*) from meal_logs where user_id != auth.uid()` via each session returns 0

**Nutrition (regressions of B01-B08)**
- [ ] "5 soaked almonds" → grams 5-10, cal <60, protein <2g
- [ ] "1 tsp olive oil" → grams ~5, cal <50
- [ ] "1 tbsp peanut butter" → grams ~15
- [ ] "1 katori toor dal" → cal 130-200, protein 6-12g
- [ ] "2 rotis and 1 katori paneer sabzi and 1 chai" → 3 items, sensible totals, no fuzzy misses
- [ ] "chia pudding 200ml" → does NOT resolve to chai
- [ ] Edit ingredient grams in composed dish → macros AND display grams update together
- [ ] Log meal, immediately delete → undo toast works
- [ ] Log meal past midnight (change device time) → date correct

**Workout (regressions of B09-B16)**
- [ ] Open today's session (Lower/leg-heavy day) → warm-up shows leg swings, not arm circles
- [ ] Save top-of-range on any lift → reopen → recommendation shows yesterday, not today's just-saved
- [ ] Try to save set with blank weight → warning
- [ ] Enter RIR 20 → clamped + warning
- [ ] Swap an exercise via alternatives menu → complete workout → no prehab-not-logged trap
- [ ] Tap Finish with 0 sets logged → blocked
- [ ] Complete a real session → streak ticks, dashboard shows ✓

**Streaks / dates (regressions of B17-B23)**
- [ ] At 00:15 device time, log a meal → appears in today's totals + streak
- [ ] Open app on a day after a fresh log → streak count > 0

**Race / idempotency (regressions of B24-B29)**
- [ ] Double-tap Log Weight → 1 row created, no error toast
- [ ] Tap water + 5 times fast → count reads 5
- [ ] Simulate offline → log meal → reconnect → 1 meal, not 2

**Trust (regressions of B30-B36, B37-meal)**
- [ ] Check 1 skin step → dashboard doesn't say "Done"
- [ ] Retake Assessment → form prefills; no data lost on completion
- [ ] Try assessment with age 500 → blocked
- [ ] Import garbage file → red toast with count
- [ ] Force offline → attempt weight log → clear error toast (until offline queue ships post-launch)
- [ ] Delete a meal → 5-sec undo toast → tap Undo → meal restored
- ~~[ ] Backdate a meal~~ — deferred (B38)
- ~~[ ] Undo workout finish~~ — deferred (B37-workout, needs schema)

**Skin + weight + photos**
- [ ] Log weight, view chart, view 28-day trend → numbers match
- [ ] Upload progress photo → thumbnail visible, still visible after 10 min
- [ ] Complete AM + PM routine → dashboard "Done" only after all steps

**PWA basics**
- [ ] Install to home screen (Android + iOS if available)
- [ ] Open installed → no install banner shown
- [ ] Kill and reopen → session persists

Track defects in `HOTFIX_LOG.md`. Any ★ CRITICAL regression blocks go-live.

---

## Model selection cheat sheet

| Batch | Model | Why |
|-------|-------|-----|
| 0 (schema) | **Opus 4.7** | Migrations are one-shot on prod, need careful reasoning about data preservation |
| 1 (parse-meal) | **Opus 4.7** | Nuanced ranking logic + AI response handling |
| 2 (UTC→local) | **Sonnet 5** | Mechanical grep-and-replace with light judgment |
| 3 (races) | **Sonnet 5** | Mechanical hook rewrites, one pattern repeated |
| 4 (workout safety) | **Opus 4.7** | Cross-file safety logic, contraindications, RLS |
| 5 (trust) | **Sonnet 5** | UI polish + shared context provider, patterned work |
| 6 (deploy + E2E) | **Opus 4.7** | Judgment calls on regressions, hotfix triage |

Post-launch batches 7-9 (features): default to **Sonnet 5** unless designing a new schema (F11 cycle tracking, F15 shopping list, F16 push) which want **Opus 4.7**.

---

## Per-chat window efficiency (token minimization)

**One-time setup:**
1. Copy this playbook + the four audit outputs into `/docs/audit/`
2. Add a section for each batch below → each batch has its own prompt template that references only the files it needs

**Per-batch prompt template** (paste into fresh chat):

```
Read only these files:
- /Users/arpitpareek/Desktop/personal/AestheticFit/GO_LIVE_PLAYBOOK.md (skip to "Batch N" section)
- <specific files listed in the batch>

Do NOT read the whole codebase, do NOT run broad greps beyond what the batch calls for.
Do NOT invoke sub-agents or workflows.
Apply the changes listed in Batch N. After each file edit, self-verify by re-reading the diff.
When done, run `npm run build` to typecheck. Report only:
- files changed
- any batch item you couldn't complete + why
- typecheck result

Keep replies under 200 words.
```

**Additional token-savers:**
- Skip the audit-output files after Batch 0 — the playbook has the fix specs distilled
- Never re-audit; refer back to this file
- Use Sonnet for Batches 2/3/5 — 3× cheaper output tokens than Opus
- One batch = one chat window = one PR = one deploy. Don't chain.
- Turn off auto-mode's exploration for mechanical batches (say "no exploration, just apply the changes listed")
- Reserve Opus context budget by asking for `--no-explore` behavior: "do not read files not listed in the batch"
- If a batch runs long, drop the four detailed audit outputs from context — playbook is the source of truth

**Rule of thumb per batch:** 25-40k tokens on Sonnet, 30-50k tokens on Opus. If a batch is trending past that, stop and split.

---

## Timeline to Sunday night

| Slot | Batch | Model | Est time |
|------|-------|-------|----------|
| Sat evening (now) | Batch 0 — Schema | Opus | 2h |
| Sat night | Batch 1 — Parse-meal | Opus | 3h |
| Sun early morning | Batch 2 — UTC dates | Sonnet | 1.5h |
| Sun morning | Batch 3 — Races | Sonnet | 2h |
| Sun mid-morning | Batch 4 — Workout safety | Opus | 3h |
| Sun afternoon | Batch 5 — Trust surfaces | Sonnet | 3h |
| Sun late afternoon | Batch 6a — Deploy + E2E | Opus | 3h |
| Sun evening | Batch 6b — Hotfix | Opus | 2h |
| Sun night | **GO LIVE** | — | — |

**Total dev time:** ~20 hours. Aggressive but achievable if you stick to the batches without scope creep.

**If you fall behind:**
- CANNOT skip: Batches 0, 1, 2, 3, 6 (data integrity + deploy)
- CAN defer to week 1: Batches 4-5 partially — B39, B41, B42, B43, B44, B45 are all "high" not "critical"
- Minimum viable go-live: Batches 0+1+2+3+6

---

## Post-launch backlog (order matters, sizing)

**Week 1 (also includes deferred B5 items):** B38 (backdated meal — `useDailyNutrition` targetDate refactor, S), B37-workout (undo via `workout_logs.deleted_at` migration, S), B36-interceptor (full Supabase error interceptor in `supabase.ts`, S); then F02 (repeat meal, S), F09 (water tile, S), F08 (undo, S), F03 (PR celebration, S), F10 (wedding on profile, S)
**Week 2:** F04 (weekly recap, M), F05 (streak freeze, S), F06 (fix-and-remember, M), F07 (backdated meal, S — if not shipped Sat)
**Week 3:** F01 (partner card, M — needs household schema)
**Week 4:** F11 (cycle tracking, L)
**Weeks 5-8:** F12, F13, F14, F16, F17, F18
**Post-cut:** F15, F19, F20, remaining LATER tier

---

## Files this playbook will reference

Keep this list current — it's what each batch prompt says "read only":

```
CLAUDE.md
APP_OVERVIEW.md
supabase/migrations/*.sql (Batch 0 only)
supabase/functions/parse-meal/index.ts (Batch 1)
supabase/seed-food-*.sql (Batch 0)
src/features/dashboard/ (Batches 2, 5)
src/features/nutrition/ (Batches 2, 3, 5)
src/features/workout/ (Batches 2, 4)
src/features/skin/ (Batches 2, 3, 5)
src/features/weight/ (Batches 2, 3)
src/features/tracking/ (Batches 2, 3)
src/features/profile/ (Batch 5)
src/features/auth/ (Batch 5)
src/lib/utils.ts (Batch 2 — add helpers)
src/lib/supabase.ts (Batch 5 — error interceptor)
src/components/ErrorBoundary.tsx (Batch 5)
main.tsx (Batch 5)
vite.config.ts (Batch 5 — service worker)
```
