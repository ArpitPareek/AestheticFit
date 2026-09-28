// Strength-session calorie ESTIMATE — mechanical-work model.
//
// Physics, not a flat per-set figure. For each rep the muscle does external work
// lifting a mass through a range of motion:
//
//     work_concentric (J) = mass_moved_kg × g × ROM_m
//
// Metabolic energy = mechanical work scaled by muscle efficiency (~20%), plus an
// eccentric-phase add-on (lowering the load still costs energy), plus a recovery
// term for the prescribed rest between sets. This gives a number that:
//   • scales with the WEIGHT used (heavier bar → more work → more kcal),
//   • differs by EXERCISE (squat moves ~⅔ of your body + the bar; a lateral raise
//     moves almost nothing but the dumbbell), via per-pattern ROM + bodyweight
//     involvement,
//   • stays correct — and philosophy-aligned — for the ladder/bodyweight users:
//     an assisted pull-up moves (bodyweight − assist), so as assistance DROPS
//     (Person B's actual progression win) the estimated burn RISES; an incline
//     push-up moves more of bodyweight as the surface LOWERS.
//
// It is still an estimate (~±30%): efficiency, ROM and bodyweight-fraction are
// population averages. DISPLAY / motivational only — never fed into the adaptive
// TDEE nutrition engine (that already captures training via intake-vs-weight).
// Surface as "~X kcal (est)". Constants are grouped up top so they're tunable
// against real logged sessions.
//
// Calibration (2026-09-27): representative hand-built fixtures at bodyweight
// ~66-75 kg now land in the intended bands —
//   light upper-isolation day  ~80 kcal   (clearly the lowest)
//   moderate mixed 45-60 min   ~150 kcal  (bottom of the 150-250 target band)
//   heavy compound leg day     ~235 kcal  (top of the band, as intended)
// before this pass the same fixtures read ~75 / ~120 / ~185, with the moderate
// session sitting below the defensible floor. Only the three calibration levers
// below moved (EFFICIENCY, ECCENTRIC_FACTOR, REST_MET); the ROM / bodyweight-
// fraction tables and the mechanical-work structure are untouched.

import type { ExerciseSet } from '../../lib/types'

const G = 9.81                 // m/s²
const J_PER_KCAL = 4184
// ── Calibration levers (tuned 2026-09-27) ────────────────────────────────────
// Adjusted upward from the initial guess (EFF 0.20 / ECC 0.35 / REST_MET 2.5),
// which produced ~105-120 kcal for a moderate mixed session — below the
// defensible 150-250 kcal band for a 45-60 min bodyweight-~70kg workout. See the
// before/after table in the calibration notes. The mechanical-work STRUCTURE is
// unchanged; only these three population-average scalars moved, each staying
// inside its physiological range:
const EFFICIENCY = 0.18        // gross efficiency of resistance exercise (~18-25%);
                               // low end owns the isometric-stabilization and
                               // negative-work economy a concentric-only figure omits.
const ECCENTRIC_FACTOR = 0.50  // the lowering phase does ~equal negative work; its
                               // metabolic cost is ~¼-½ of concentric per unit work,
                               // so a +50% add-on to the concentric cost is a fair midpoint.
const REST_MET = 3.2           // inter-set term; also proxies whole-session elevated
                               // metabolism (isometric holds, EPOC, the lifting time
                               // itself) that the external-work term barely captures. A
                               // light-activity ~3 MET floor, above the 1 MET true-rest.
const DEFAULT_REST_S = 90
const WARMUP_KCAL = 25         // pulse-raiser + mobility allowance, only if checked off
const MAX_EFFORT_BONUS = 0.12  // up to +12% for grinding well past the target RIR

// Range of motion (m) and the fraction of BODYWEIGHT that rises with the load on a
// LOADED rep, per movement_pattern. Loaded compound lifts move part of your body
// too (a back squat lifts everything above mid-thigh); presses/pulls/isolation
// move mostly just the implement. Keys cover both movement_pattern taxonomies in
// the library; unknown patterns fall back to DEFAULT_PROFILE.
interface MovementProfile { rom: number; loadedBwFrac: number }
const MOVEMENT_PROFILES: Record<string, MovementProfile> = {
  squat:            { rom: 0.50, loadedBwFrac: 0.65 },
  hinge:            { rom: 0.45, loadedBwFrac: 0.50 },
  hip_hinge:        { rom: 0.45, loadedBwFrac: 0.50 },
  lunge:            { rom: 0.45, loadedBwFrac: 0.60 },
  carry:            { rom: 0.05, loadedBwFrac: 0.00 },
  horizontal_press: { rom: 0.40, loadedBwFrac: 0.05 },
  vertical_press:   { rom: 0.55, loadedBwFrac: 0.08 },
  horizontal_pull:  { rom: 0.42, loadedBwFrac: 0.03 },
  vertical_pull:    { rom: 0.60, loadedBwFrac: 0.03 },
  push:             { rom: 0.45, loadedBwFrac: 0.06 },
  pull:             { rom: 0.45, loadedBwFrac: 0.03 },
  lateral_raise:    { rom: 0.55, loadedBwFrac: 0.02 },
  isolation:        { rom: 0.35, loadedBwFrac: 0.02 },
}
const DEFAULT_PROFILE: MovementProfile = { rom: 0.42, loadedBwFrac: 0.05 }

// Fraction of bodyweight actually moved when the exercise IS bodyweight-borne
// (push-up, pull-up, bodyweight squat, dip…), keyed by pattern.
const BODYWEIGHT_BORNE_FRAC: Record<string, number> = {
  squat: 0.65, lunge: 0.65, hinge: 0.50, hip_hinge: 0.50,
  vertical_pull: 0.90, vertical_press: 0.90, // pull-up / dip move ~all of you
  horizontal_press: 0.64, push: 0.64,        // push-up
  horizontal_pull: 0.55,                     // inverted row
}
const DEFAULT_BODYWEIGHT_BORNE_FRAC = 0.55

const profileFor = (p: string | null | undefined): MovementProfile =>
  (p && MOVEMENT_PROFILES[p]) || DEFAULT_PROFILE

// incline-push-up ladder: surface_level 5 (wall, easiest) → 1 (floor, hardest).
// Push-up bears ~64% of bodyweight on the floor, far less against a wall.
const surfaceBodyweightFrac = (level: number): number =>
  Math.max(0.15, 0.64 - (level - 1) * 0.11)

const isBodyweightEquip = (equipment: string[]): boolean =>
  equipment.some((e) => e === 'bodyweight' || e === 'none')

export interface LoggedExerciseForKcal {
  sets: ExerciseSet[]
  /** exercise_library movement_pattern (either taxonomy); null → default profile. */
  movementPattern: string | null
  /** exercise_library equipment array — flags bodyweight moves. */
  equipment: string[]
  /** prescribed rest between sets (s); null → DEFAULT_REST_S. */
  restSeconds: number | null
  /** plan's target RIR — drives the small "grind past target" effort bonus. */
  targetRir: number | null
}

export interface StrengthKcalInput {
  exercises: LoggedExerciseForKcal[]
  bodyweightKg: number | null
  /** whether the day's warm-up was checked off — adds a small fixed allowance. */
  warmupDone?: boolean
}

/** Mass (kg) that rises on one concentric rep of this set, given how it's loaded. */
function movedMassKg(set: ExerciseSet, ex: LoggedExerciseForKcal, bodyweightKg: number): number {
  const profile = profileFor(ex.movementPattern)

  // Ladder / assisted: you lift your own bodyweight minus the machine/band help.
  if (set.assist_kg != null) {
    const borne = BODYWEIGHT_BORNE_FRAC[ex.movementPattern ?? ''] ?? 0.90
    return Math.max(0, bodyweightKg * borne - set.assist_kg)
  }
  // Ladder / incline surface: a fraction of bodyweight set by the surface height.
  if (set.surface_level != null) {
    return bodyweightKg * surfaceBodyweightFrac(set.surface_level)
  }
  // Pure bodyweight move (no external load logged).
  if ((set.weight_kg ?? 0) <= 0 && isBodyweightEquip(ex.equipment)) {
    const borne = BODYWEIGHT_BORNE_FRAC[ex.movementPattern ?? ''] ?? DEFAULT_BODYWEIGHT_BORNE_FRAC
    return bodyweightKg * borne
  }
  // Loaded: the implement + the part of your body that travels with it.
  return (set.weight_kg ?? 0) + bodyweightKg * profile.loadedBwFrac
}

/**
 * Estimate calories for a strength session. Returns null when it can't estimate
 * (no bodyweight, or no working set with reps > 0). Rounded to the nearest 5 —
 * this is a signal, not a precise measurement.
 */
export function estimateStrengthCalories(input: StrengthKcalInput): number | null {
  const { exercises, bodyweightKg, warmupDone } = input
  if (!bodyweightKg || bodyweightKg <= 0) return null

  let kcal = 0
  let workingSets = 0

  for (const ex of exercises) {
    const sets = ex.sets.filter((s) => (s.reps ?? 0) > 0)
    if (sets.length === 0) continue
    const { rom } = profileFor(ex.movementPattern)
    const restS = ex.restSeconds && ex.restSeconds > 0 ? ex.restSeconds : DEFAULT_REST_S

    for (const s of sets) {
      workingSets++
      const mass = movedMassKg(s, ex, bodyweightKg)

      // Active phase: mechanical work → metabolic energy (concentric + eccentric).
      const workJ = mass * G * rom * (s.reps || 0)
      let activeKcal = (workJ * (1 + ECCENTRIC_FACTOR)) / EFFICIENCY / J_PER_KCAL

      // Small effort bonus when the set was taken past its target RIR.
      if (ex.targetRir != null && s.rir != null) {
        const overreach = Math.max(0, ex.targetRir - s.rir)
        activeKcal *= 1 + Math.min(MAX_EFFORT_BONUS, overreach * 0.04)
      }

      // Recovery phase: the rest that follows the set sits above true rest.
      const restKcal = REST_MET * bodyweightKg * (restS / 3600)

      kcal += activeKcal + restKcal
    }
  }

  if (workingSets === 0) return null
  if (warmupDone) kcal += WARMUP_KCAL
  return Math.round(kcal / 5) * 5
}
