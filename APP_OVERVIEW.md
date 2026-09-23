# AestheticFit v5 — Complete Product & Technical Overview

> A single, self-contained reference describing what the app is, how it's built, how every
> feature works and executes, the full data model, and a consolidated list of known gaps,
> inconsistencies, and bugs. Written to be handed to an LLM for analysis and prioritization.
>
> Generated from a full read of the codebase. Paths are relative to the repo root.

---

## 0. TL;DR

AestheticFit is a **personal, mobile-first PWA for exactly two users** (Arpit + Harshita) that
combines **workout programming, nutrition/calorie tracking, weight tracking, skincare routines,
daily habit tracking, and a dashboard**. It is a React + TypeScript + Vite frontend on a Supabase
(Postgres + Auth + RLS + Edge Functions) backend, deployed to Vercel, installable as a PWA.

The app is **mid-refactor** from an older single-file HTML prototype into a structured full-stack
app. Several subsystems are **half-migrated**: a new data-driven workout generator is live, but an
older plan shape, a rich set-logging flow, and an adaptive nutrition engine are only partially
wired. The most important structural theme for any reviewer is **"old shape vs new shape"
duplication** and **features that exist in the backend/hooks but have no UI**.

---

## 1. Product

### 1.1 Who it's for
- **2 hardcoded humans**, distinguished mainly by `sex`:
  - **Arpit** (male) → `recomp` goal, Push/Pull/Legs + Upper/Lower training, a specific skincare routine.
  - **Harshita** (female) → `cut` goal, retention-focused training, a different skincare routine.
- Architecture *claims* N-user support (every table has `user_id` + RLS), but **profile-specific
  content is keyed by `sex`**, not by a general profile model (skincare routines, and some
  dashboard heuristics). So today it genuinely supports only two personas.

### 1.2 What it does (feature pillars)
1. **Assessment** — an 8-step onboarding wizard capturing goals, training history, availability,
   equipment, preferences, injuries, and lifestyle.
2. **Workout** — deterministically generates a phased training plan from the assessment, shows
   "today's" session, and (planned) logs sets.
3. **Nutrition** — log meals from an Indian food database, track calories/macros vs targets, with
   an adaptive TDEE engine that recalibrates targets over time (backend only).
4. **Weight** — log weight/waist, chart trend with moving average, project time-to-goal.
5. **Skin** — per-person AM/PM routines by weekday, checklist tracking, fortnightly skin check-ins.
6. **Tracking** — daily steps / sleep / water.
7. **Dashboard** — a "today" hub aggregating all of the above + streaks + "week N of your
   transformation" expectation messaging.

### 1.3 Design principles (from CLAUDE.md, largely honored)
- Mobile-first, 375px primary viewport, dark mode forced.
- Every table has `user_id` + RLS; no cross-profile leakage.
- Historical logs immutable; plan changes create new versions, don't mutate past logs.
- AI calls go through Edge Functions, never the frontend. (Currently there are **no LLM calls at
  all** — the "AI" adaptive engine is pure arithmetic.)
- Offline-capable PWA; JSONB for nested data.

---

## 2. Tech Stack & Build

| Layer | Choice |
|---|---|
| Frontend | React 19.2, TypeScript ~6.0, Vite 8.2 |
| Styling | Tailwind CSS 3.4 (`darkMode: 'class'`, dark forced via `<html class="dark">`) |
| Backend | Supabase (Postgres + Auth + RLS + Edge Functions, Deno) |
| Charts | recharts 3.10 |
| Icons | lucide-react |
| PWA | vite-plugin-pwa 1.3 (`autoUpdate`, Workbox precache + NetworkFirst for Supabase REST) |
| Routing | **`react-router-dom` 7.18 is installed but NEVER imported** — dead dependency. Navigation is `useState`-driven tabs. |
| Lint | oxlint |
| Deploy | Vercel (free tier) |

**Scripts:** `npm run dev` (vite), `npm run build` (`tsc -b && vite build`), `npm run preview`, `npm run lint` (oxlint).

**Env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in `.env`). Supabase client is created untyped (no generated `Database` type) — all queries cast at call site.

---

## 3. Frontend Architecture

### 3.1 Entry & routing
- `src/main.tsx` — React 19 bootstrap (`createRoot` + `StrictMode`), imports `index.css`. PWA SW
  registration handled by vite-plugin-pwa.
- `src/App.tsx` — **No react-router.** `AppContent` holds `const [activeTab, setActiveTab] =
  useState<TabId>('today')`; a `switch(activeTab)` selects the page. Six pages are `lazy()`-loaded
  (Dashboard, TodayWorkout, MealLogger, TrackPage, SkinRoutine, ProfilePage); AssessmentForm and
  PlanReview are eager.

**Gating order in `AppContent`:**
1. `loading` → full-screen skeleton.
2. `!hasCompletedAssessment` → `<AssessmentForm>` (own ErrorBoundary).
3. `!hasPlan && assessment && user` → `<PlanReview>` (own ErrorBoundary).
4. else → `<AppShell>` + tab-switched page inside `<ErrorBoundary resetKeys={[activeTab]}>` + `<Suspense>`.

**Provider nesting:** `ErrorBoundary → AuthProvider → ProtectedRoute → ProfileProvider → AppContent`.
ProfileProvider is inside ProtectedRoute so it only mounts once a user exists.

### 3.2 Layout & shared components
- `src/components/layout/AppShell.tsx` — the only layout file. Contains the **inlined** bottom nav
  (6 tabs), scroll-to-top on tab change, tap-active-tab-to-scroll-top, and the PWA "Add to Home
  Screen" banner (listens for `beforeinstallprompt`, dismiss flag in `localStorage['aefit_a2hs_dismissed']`).
  There is **no** separate `BottomNav.tsx` or `Header.tsx`.
- `src/components/ErrorBoundary.tsx` — class component. `getDerivedStateFromError` +
  `componentDidCatch` (logs stack). `componentDidUpdate` clears a latched error when any `resetKeys`
  entry changes (Object.is compare). Fallback = icon + title + message + "Try Again".
- **`src/components/ui/` is EMPTY.** There is no Button/Input/Card/Modal/Badge/ProgressBar
  primitive library despite CLAUDE.md describing one. Every control is hand-rolled inline Tailwind
  in each feature. `src/hooks/` is also empty; hooks are colocated per feature.

### 3.3 Contexts
- `AuthContext` — holds `user`, `session`, `loading`. `getSession()` then `onAuthStateChange`
  subscription. `signIn(email,password)`, `signOut()`. `useAuth` throws outside provider.
- `ProfileContext` — parallel `Promise.all` fetch keyed on `user.id`: `profiles`, latest
  `assessments`, active `workout_plans` (`is_active=true`), latest draft plan (`is_active=false`).
  Exposes `profile, assessment, activePlan, draftPlan, hasCompletedAssessment, hasPlan, loading,
  reload`.

### 3.4 Styling / PWA specifics
- `index.html` forces dark (`<html class="dark">`), iOS PWA meta, `viewport-fit=cover`,
  `maximum-scale=1.0, user-scalable=no`, theme-color `#0f172a`.
- `index.css` — Tailwind layers; safe-area padding; disables number spinners; forces 16px input
  font (prevents iOS zoom); global `user-select: none` except inputs; `.skeleton` utility.
- `tailwind.config.js` — `darkMode:'class'`; custom colors `background #0f172a`, `card #1e293b`. No
  custom fonts/plugins.
- `vite.config.ts` — VitePWA `autoUpdate`; Workbox precache; **NetworkFirst** runtime cache for
  Supabase REST (`supabase-api`, 50 entries / 300s, 3s network timeout). Manifest: name
  "AestheticFit", short "AeFit", standalone, portrait, icons 192/512/512-maskable.

---

## 4. Data Model (Supabase)

### 4.1 Migration status ⚠️
- **001–013 are committed/tracked.** **014, 015, 016, 017, 018, 019 are git-untracked (new)**, as
  are `supabase/functions/`, `seed-foods.sql`, `seed-nutrition.sql`.
- The remote database (as observed live) is **missing at least migration 019** — the
  `exercise_library.deprecated` column does not exist remotely. This means the app's own
  `planGenerator.fetchLibrary` (which selects `deprecated`) would fail with Postgres error `42703`
  against remote, so the in-app **"Reset & Regenerate Plan" button is currently broken** until
  014–019 are applied.
- `full_schema.sql` reflects **only 001–013** — stale, not regenerated after the nutrition/exercise
  work.
- Migration **016 has a numbering gap** (sections 1,2,3,5,6 — no section 4), suggesting a dropped block.
- Remote `exercise_library` currently holds only **6 rows**, so generated plans draw from a tiny pool.

### 4.2 Table reference

| Table | Migration | Key columns | RLS |
|---|---|---|---|
| **profiles** | 001 (+014) | id PK→auth.users, display_name, age, sex CHECK(male/female), height_cm, current_weight_kg, target_weight_kg, timestamps; **014 adds** calorie_target, protein_target_g, carb_target_g, fat_target_g (ORPHANED — never read/written) | select/insert/update own; **no delete** |
| **assessments** | 002 | id, user_id, version, responses jsonb, completed_at, created_at | own |
| **workout_plans** | 003 | id, user_id, assessment_id→assessments(set null), plan_version, plan_name, plan_data jsonb, phase, total_phases, weeks_per_phase, start_date, is_active, created_at | own |
| **exercise_library** | 004 (+015,017,018,019) | id text PK, name, primary_muscle, secondary_muscles[], movement_pattern CHECK, equipment[], difficulty, instructions, form_cues[], common_mistakes[], youtube_search_url, alternatives[]; **015** cues jsonb, youtube_id, gif_url, stability_demand, sfr_rating, contraindications[]; **017** media_attribution, media_license + widened CHECK; **019** deprecated bool | read-only (authenticated); writes = service role |
| **workout_logs** | 005 | id, user_id, plan_id→workout_plans(set null), plan_version, workout_date, day_label, started_at, completed_at, notes | own |
| **exercise_logs** | 006 (+015) | id, user_id, workout_log_id→workout_logs(cascade), exercise_id→exercise_library(set null), exercise_name, order_index, sets jsonb; **015** library_exercise_id, custom_exercise_id, swapped_from_ref, swap_reason, is_ad_hoc, plan_version_id | own |
| **food_library** | 007 | id text PK, name, aliases[], category, is_vegetarian, serving_size, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g, source CHECK(ifct/manual/estimated) | read-only; writes = service role |
| **meal_logs** | 008 (+015) | id, user_id, log_date, meal_type CHECK(breakfast/lunch/dinner/snack), food_id→food_library(set null), food_name, servings, calories, protein_g, carbs_g, fat_g, notes; **015** custom_food_id→custom_foods, item_label, fiber_g, source CHECK(library/custom/recipe/ai_parsed/quick_add), drops NOT NULL on food_id, adds `meal_log_identity` CHECK | select/insert/update/**delete** own (only table with delete) |
| **weight_logs** | 009 | id, user_id, log_date, weight_kg, waist_cm, notes, **UNIQUE(user_id, log_date)** | own |
| **skin_logs** | 010 | id, user_id, log_date, routine_type CHECK(am/pm), steps_done jsonb, notes | own |
| **skin_checkins** | 011 | id, user_id, checkin_date, texture_score/evenness_score/hydration_score CHECK(1–5), breakout_level CHECK(none/few/moderate/many), notes | own |
| **daily_logs** | 012 | id, user_id, log_date, steps, sleep_hours, water_glasses, notes, **UNIQUE(user_id, log_date)** | own |
| **streaks** | 013 | id, user_id, streak_type CHECK(workout/nutrition/overall), current_count, longest_count, last_active_date | own |
| **custom_foods** | 015 | id, user_id, name, category, aliases[], serving_label, serving_grams, calories, protein/carbs/fat/fiber_g, is_recipe, is_veg, source CHECK(manual/ai_parsed/ifct/barcode) | all own |
| **recipe_ingredients** | 015 | id, recipe_id→custom_foods(cascade), library_food_id→food_library, custom_food_id→custom_foods, quantity_servings, `one_food_ref` CHECK | all via parent ownership |
| **custom_exercises** | 015 | id, user_id, name, primary_muscle, secondary_muscles[], movement_pattern, equipment[], difficulty, cues jsonb, youtube_id, gif_url | all own |
| **nutrition_config** | 016 | user_id PK, goal_mode CHECK(recomp/cut/lean_bulk/maintain), trend_window_days, target_rate_kg_week, calorie_floor, calorie_cap, protein_g_target, activity_multiplier, min_log_adherence(0.7), adjust_interval_days(14), last_adjusted_at | all own |
| **tdee_estimates** | 016 | id, user_id, calc_date, method CHECK(seed_mifflin/adaptive), window_days, avg_intake_kcal, trend_weight_start/end_kg, weight_delta_kg, estimated_tdee_kcal, log_adherence, confidence | select-only own (writes = service role) |
| **nutrition_targets** | 016 | user_id PK, calories, protein_g, carbs_g, fat_g, fiber_g, updated_at | all own |
| **nutrition_target_history** | 016 | id, user_id, effective_date, macros, deficit_kcal, goal_mode, reason, source CHECK(engine/manual) | select own; insert own only when source='manual' |
| **weight_trend** (VIEW) | 016 | `security_invoker=on` view over weight_logs → adds ma_7d, ma_14d, ma_28d (RANGE-based moving averages so skipped weigh-ins don't skew) | inherits weight_logs RLS |

### 4.3 Edge Function — `adjust-nutrition-targets`
- `supabase/functions/adjust-nutrition-targets/index.ts` (Deno). Uses SERVICE_ROLE key (bypasses
  RLS). Intended to run on a **weekly pg_cron**; deploy `--no-verify-jwt`. **No LLM calls.**
- **Not invoked from the frontend** (no `functions.invoke` anywhere in `src/`).
- Logic per user: pull weight_logs + meal_logs over `trend_window_days`; require ≥4 weigh-ins;
  compute average intake over days-logged + adherence; least-squares weight slope → rate/week;
  `adaptiveTdee = avgIntake − (weightDelta×7700/window)`; always writes a `tdee_estimates` audit row.
  Gates: too-soon (interval), low adherence, insufficient data. Mode-aware ±120 kcal step with
  dead-band; guardrails clamp to floor/cap, never below `adaptiveTdee×0.70`, round to 25. Macros:
  protein = max(current, target); **fat held constant; carbs absorb the entire delta** (quirk — can
  drive carbs toward 0). Writes `nutrition_target_history` + updates `nutrition_targets` + stamps
  `last_adjusted_at`.

---

## 5. Feature-by-Feature Execution

### 5.1 Assessment (`src/features/profile/`)
- `AssessmentForm.tsx` — 8-step wizard (`StepBasics, StepGoals, StepTraining, StepAvailability,
  StepEquipment, StepPreferences, StepLifestyle, StepReview`). Each "Next" **persists partial
  progress** to `assessments` (insert first time, update by id after).
- Final "Generate My Plan" sets `completed_at` and **upserts `profiles`** (mirrors basics). It does
  **not** itself generate a plan — plan generation is a separate flow (see 5.2). Button label is
  misleading.
- **`AssessmentResponses` model:** `basics` (name/age/sex/height/current+target weight), `goals`
  (primary/secondary/priorities[]), `training` (level/gym_months/frequency/sports), `availability`
  (days_per_week/session_minutes/preferred_days/time), `equipment[]`, `preferences`
  (enjoy/cannot_do/injuries free-text/preference), `lifestyle`
  (cardio_preference/daily_steps/sleep_hours/job_type). Enums in `types.ts`.

### 5.2 Workout (`src/features/workout/`) — the most complex subsystem
**Live pipeline (NEW, deterministic, no LLM):**
`planTypes.ts` (contracts) → `planTemplates.ts` (phase/day/slot templates per goal) →
`exerciseSelector.ts` (`fillSlot` picks from `exercise_library` by target/pattern/equipment/
injury/preference scoring) → `planGeneratorCore.ts` (`generatePhasePlanData` pure function) →
`planGenerator.ts` (IO: fetch library/assessment/goal_mode, insert/activate/advance plans) →
`PlanReview.tsx` (review + activate) and `TodayWorkout.tsx` (read-only session list).

- **NEW plan shape** stored in `workout_plans.plan_data`:
  `PlanData = { version, phase, total_phases, days: PlanDay[] }`, where
  `PlanDay = { label, split, exercises: PlanSlotExercise[] }` and each exercise has
  `{ ref:{type,id}, sets, rep_low, rep_high, rir, rest_s, progression, alternatives[], note? }`.
- **Phase templates:** RECOMP = 4 phases (Foundation→Accumulation→Intensification→Peak), CUT = 4
  phases (Re-acclimation→Retention→Deficit→Final push). Tiers ramp RIR 3→1 and switch primaries to
  double-progression later. `getPhaseTemplates('cut')` → CUT else RECOMP — **`lean_bulk` and
  `maintain` are unmodeled and silently fall back to recomp.**
- **Session count** = `assessment.availability.days_per_week` (else template day count); days built
  by cycling `template.days[i % len]`.
- **Exercise selection** scoring: base `sfr_rating×2`, +machine/cable/barbell/dumbbell/bodyweight by
  preference, +1 for low stability demand; deterministic id tiebreak. Filters out deprecated,
  wrong equipment, cannot-do, injury-contraindicated. Alternatives (≤3) backfilled by muscle family.
- **Injury bridge:** `injuryTags.ts` maps free-text `preferences.injuries` → tags
  (cervical/shoulder/lower_back/knee/wrist) via keyword substring matching.
- **Plan lifecycle:** `generateDraftPlan` (idempotent draft insert, `is_active=false`) →
  `activatePlan` (deactivate all, activate one — one-active invariant) → `advanceToNextPhase` (new
  version row, old deactivated but never mutated). `advanceToNextPhase` reads last 20 exercise_logs
  + latest weight_trend but **discards them** (placeholder for future adaptive logic).
- **"Today" logic** (`useTodayWorkout`): **KNOWN SIMPLIFICATION** — no weekday/calendar mapping.
  Sessions are a flat cycling list; "today" = `floor(daysSinceStart) % days.length`. `isRestDay` is
  **always false** when a plan exists. Returns safe empty state for legacy/missing `days`.

**ORPHANED / not wired into live UI (dead or half-built):**
- `ProgressEngine.ts` — full progression logic (linear/double-progression, deload, failure
  deloads) but consumes OLD-shape types with **zero producers**; imported nowhere.
- `ExerciseCard.tsx` — rich card using the OLD static exercise constant + fields not on
  `LibraryExercise`; imported nowhere.
- `hooks/useWorkoutLogger.ts` — writes `workout_logs`/`exercise_logs`; **hardcodes `plan_version:1`**
  (latent bug for versioned history); imported nowhere → **set/RIR logging is not reachable in the
  live UI. TodayWorkout is read-only.**
- `hooks/useExerciseHistory.ts` — reads exercise history; imported nowhere.
- `plan_version_id` exists as a column (015) and in a code comment, but nothing reads/writes it.

### 5.3 Nutrition (`src/features/nutrition/`) — smaller than it looks
- Only **3 files**: `MealLogger.tsx`, `hooks/useDailyNutrition.ts`, `hooks/useNutritionTargets.ts`.
  No `DailyTotals`/`NutritionTargets`/`FoodDB` components (only interfaces + inline JSX).
- **Meal logging:** `MealLogger` food picker is backed by the **static `foods.ts` array (41 Indian
  foods)** — NOT the DB `food_library`. On add, it writes a `meal_logs` row with
  **`food_id: null` always** (never stores the picked id), macros pre-multiplied by servings. So
  `meal_logs` entries are free-text snapshots; the FK to `food_library` is never exercised.
- **Daily totals** computed client-side by reducing today's meals. `today` is captured **once at
  mount** (`useRef`) → no midnight rollover; `reload` is a **no-op stub**. It selects only base
  columns, ignoring 015 columns (`custom_food_id`, `source`, `fiber_g`, `item_label`).
- **Targets:** `useNutritionTargets` reads `nutrition_targets` (custom) else computes from
  profile weight/sex else `DEFAULT_TARGETS`. `saveTargets`/`resetTargets` exist and are also called
  from ProfilePage's targets editor. Three `// TODO: drop profiles target columns once verified`
  markers reference the orphaned 014 `profiles` columns.
- **Not surfaced anywhere:** custom foods/recipes (015), the adaptive TDEE engine, `tdee_estimates`,
  `nutrition_target_history`. `nutrition_config`/`weight_trend` are read only by the **workout**
  generator, not by nutrition.

### 5.4 Weight (`src/features/weight/`)
- `useWeightLogs` upserts `weight_logs` by (user, date); `WeightTracker` validates weight 20–300kg,
  waist 30–200cm; `WeightLog.notes` never written by UI.
- `computeTrend` "4-Week Trend" compares last-10-days avg vs 35–42-day-ago avg — **window
  boundaries don't match the "4-week" label**.
- `computeGoal` projects weeks-to-goal from last-28-day rate; **`_primaryGoal` param passed but
  unused**.
- `WeightChart` (recharts) shows last 84 days, 3-point moving-average trend line (client-computed —
  the DB `weight_trend` view's MAs are NOT used here), optional waist on right axis.

### 5.5 Skin (`src/features/skin/`)
- Routines are **two hardcoded profiles** in `skincare.ts` keyed by `sex`
  (`getRoutineForProfile(sex)` → Harshita if female else Arpit). AM step arrays (some `onlyDays`
  gated) + PM routines keyed by weekday (glycolic/tretinoin/rest/retinal, etc.), with `waitMinutes`
  timers and notes.
- `SkinRoutine.tsx`: day picker, AM/PM checklist cards (ring when complete), Wait timers, hair
  section, purge warning if a PM step mentions tretinoin, check-in prompt when due.
- `useSkinLogs` toggles steps into `skin_logs.steps_done` (jsonb map), one row per (date,
  routine_type).
- `useSkinCheckins` **inserts** (not upserts) into `skin_checkins` → duplicate same-day check-ins
  possible; `isDue` = none or ≥14 days. `SkinCheckin.tsx` has 3 score selectors (1–5) + breakout
  level + a **text-only camera reminder (no actual photo upload)**. `CheckinHistory` sparklines
  texture/evenness/hydration; **breakout_level captured but never charted**.

### 5.6 Tracking (`src/features/tracking/`)
- `TrackPage` stacks `WeightTracker` + `DailyTracker`.
- `DailyTracker`: steps (onBlur), sleep hrs (onBlur, 0–24), water (+/- stepper, clamp 0–30, saves
  immediately). Each field is an independent upsert into `daily_logs` (one row per day).

### 5.7 Dashboard (`src/features/dashboard/`)
- `Dashboard.tsx` aggregates: profile, today's workout, nutrition totals+targets, streaks, and
  `useDashboardData` (latest weight, sleep, steps, AM/PM skin done, workout done today; **fetches
  `todayWater` but never renders it — dead**).
- Cards: status bar (greeting, "Week N of your transformation", streak flame), quick-stat rings
  (calories/protein/steps/weight/sleep), today's workout button, nutrition snapshot (+ amber
  warning if past 2pm and protein <50%), skin routine button, week-bucketed expectation card, skin
  expectation banner.
- **"Week N"** = `floor((now − start_date)/1 week)+1`. Expectation copy bucketed by week.
- **`usesTretinoin` heuristic (Dashboard.tsx)** = `sex==='female' ? week>=3 : true` — unrelated to
  actual routine data; can show purging advice to users whose routine has none.
- **Streaks** (`useStreaks` + `checkTodayActivity`): `streaks` row `streak_type='overall'`; broken
  if >1 day gap; `recordActivity` increments/resets; Dashboard auto-records on load. Rest days count
  meals/skin/weight; otherwise any of workout/meal/skin/weight.

### 5.8 Profile / Settings (`ProfilePage.tsx`)
- Profile summary; **Wedding countdown stored only in `localStorage['aefit_wedding_date']` (not DB,
  not synced across devices)**; Active Plan card (now reads NEW shape: plan_name, phase/total_phases,
  sessions/week, per-day list); "Reset & Regenerate Plan" only sets `is_active=false` (relies on
  the no-plan flow to regenerate); Nutrition targets editor (save/reset); Assessment summary; Retake
  assessment (version+1); **Data export/import** (11 tables to/from a JSON blob; import upserts raw
  rows incl. ids and relies on RLS/FK order — cross-user import would collide); Sign out.

---

## 6. Cross-Cutting Issues & Gaps (prioritized for review)

### 6.1 Correctness / bugs
1. **Remote schema drift (HIGH):** migrations 014–019 appear unapplied to remote; `deprecated`
   column missing → in-app plan regeneration fails (`42703`). `full_schema.sql` is stale.
2. **`useWorkoutLogger` hardcodes `plan_version:1`** → logged history won't track the active plan
   version after `advanceToNextPhase`. (Moot today since logging isn't wired, but a landmine.)
3. **UTC "today" everywhere:** all hooks use `new Date().toISOString().slice(0,10)`. For IST users
   the logical day flips at 05:30 local → late-night/early-morning logs land on the wrong `log_date`.
   Pervasive (dashboard, streaks, skin, weight, daily, nutrition).
4. **`useDailyNutrition` date frozen at mount** (no midnight rollover) and `reload` is a no-op stub.
5. **`meal_logs.food_id` always null** — food identity is never persisted; breaks any future
   per-food analytics and the FK's purpose.
6. **`skin_checkins` inserts, not upserts** → duplicate same-day check-ins possible.
7. **Engine macro quirk:** fat held constant, carbs absorb 100% of calorie deltas → repeated cuts
   push carbs toward 0.
8. **`weight_trend` view MAs unused** by the chart (which recomputes a 3-point SMA client-side).

### 6.2 Half-migrated / dead code
9. **Old-vs-new plan type triplication:** `lib/types.ts` legacy `WorkoutPlan`/`Phase`/`DayPlan` +
   `GeneratedWorkoutPlan` (both dead) vs the live `planTypes.ts` `PlanData`. Consolidate/delete.
10. **Orphaned workout modules:** `ProgressEngine.ts`, `ExerciseCard.tsx`, `useWorkoutLogger.ts`,
    `useExerciseHistory.ts` — the **entire set-logging + progression flow is not reachable**;
    `TodayWorkout` is read-only.
11. **Orphaned 014 `profiles` target columns** (superseded by `nutrition_targets`); 3 TODOs to drop.
12. **015 custom foods/recipes/exercises have no frontend.** Adaptive TDEE engine has no UI.
13. **Empty scaffolding:** `src/components/ui/`, `src/hooks/` unused. `react-router-dom` unused.
14. **Two disconnected food DBs:** static `foods.ts` (used) vs `food_library`+`seed-foods.sql`
    (unused). `source` enum mismatch (`'ifct-approximate'` vs DB CHECK `'ifct'`).

### 6.3 Product / UX gaps
15. **Only two personas** (keyed by `sex`) despite "N-user" claims — skincare + some dashboard logic
    won't generalize.
16. **No workout logging UI** — you can view "today" but not record sets/reps/weights; ProgressEngine
    can't run without logged data.
17. **No photo capture** for skin (text reminder only); breakout level never visualized.
18. **`lean_bulk`/`maintain` goals unmodeled** in workout templates (silently → recomp).
19. **Label/logic mismatches:** WeightTracker "4-Week Trend" windows; StepGoals "drag to reorder"
    has no drag and no move-down.
20. **Adaptive nutrition invisible:** the engine changes targets on a cron with no user-facing
    history, explanation, or notification.
21. **Wedding countdown not persisted server-side** (localStorage only).
22. **Data import/export** is raw-row upsert with no schema/version validation.

### 6.4 Architecture / hardening
23. Supabase client is **untyped** — no generated `Database` types; every query cast manually.
24. **No test suite** anywhere.
25. Migration hygiene: 016 section-4 gap; untracked migrations; stale `full_schema.sql`; no
    migration-state tracking to confirm what's applied to remote.
26. **No shared UI primitive layer** → inconsistent, duplicated inline Tailwind across features.

---

## 7. Suggested Reading Order for a Reviewer
1. `src/App.tsx` + `src/components/layout/AppShell.tsx` (shell & gating)
2. `src/features/profile/ProfileContext.tsx` + `types.ts` (state + assessment model)
3. `src/features/workout/` in pipeline order: `planTypes → planTemplates → exerciseSelector →
   planGeneratorCore → planGenerator → useTodayWorkout → TodayWorkout/PlanReview`
4. `src/features/nutrition/` (3 files) + `supabase/functions/adjust-nutrition-targets/index.ts` +
   `supabase/migrations/016_tdee_nutrition_engine.sql`
5. `src/features/dashboard/Dashboard.tsx` (aggregation + streaks)
6. `supabase/migrations/` 001→019 for the full schema
