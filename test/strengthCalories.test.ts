import { describe, it, expect } from 'vitest'
import {
  estimateStrengthCalories,
  type LoggedExerciseForKcal,
  type StrengthKcalInput,
} from '../src/features/workout/strengthCalories'
import type { ExerciseSet } from '../src/lib/types'

// ─── Fixture builders ──────────────────────────────────────
// These lock in the CURRENT behavior of estimateStrengthCalories() (and, through
// its assisted / surface / bodyweight / loaded branches, movedMassKg()). Every
// directional test asserts an INEQUALITY so it survives future recalibration of
// the constants; only the golden test pins an exact number.

function makeSet(over: Partial<ExerciseSet> = {}): ExerciseSet {
  return { set_number: 1, weight_kg: 0, reps: 8, ...over }
}

function makeExercise(over: Partial<LoggedExerciseForKcal> = {}): LoggedExerciseForKcal {
  return {
    sets: [makeSet()],
    movementPattern: 'squat',
    equipment: ['barbell'],
    restSeconds: 90,
    targetRir: null,
    ...over,
  }
}

function makeInput(over: Partial<StrengthKcalInput> = {}): StrengthKcalInput {
  return { exercises: [makeExercise()], bodyweightKg: 80, ...over }
}

// ─── null-guard behaviors ──────────────────────────────────
describe('estimateStrengthCalories — null guards', () => {
  it('returns null when bodyweightKg is null', () => {
    expect(estimateStrengthCalories(makeInput({ bodyweightKg: null }))).toBeNull()
  })

  it('returns null when bodyweightKg is 0', () => {
    expect(estimateStrengthCalories(makeInput({ bodyweightKg: 0 }))).toBeNull()
  })

  it('returns null when bodyweightKg is negative', () => {
    expect(estimateStrengthCalories(makeInput({ bodyweightKg: -70 }))).toBeNull()
  })

  it('returns null when exercises is empty', () => {
    expect(estimateStrengthCalories(makeInput({ exercises: [] }))).toBeNull()
  })

  it('returns null when every set has reps = 0', () => {
    const ex = makeExercise({
      sets: [makeSet({ reps: 0 }), makeSet({ reps: 0, set_number: 2 })],
    })
    expect(estimateStrengthCalories(makeInput({ exercises: [ex] }))).toBeNull()
  })
})

// ─── load / rep sensitivity ────────────────────────────────
describe('estimateStrengthCalories — mechanical-work sensitivity', () => {
  it('heavier weight_kg on the same exercise → strictly higher kcal', () => {
    const light = makeInput({
      exercises: [makeExercise({ sets: [makeSet({ weight_kg: 40 })] })],
    })
    const heavy = makeInput({
      exercises: [makeExercise({ sets: [makeSet({ weight_kg: 120 })] })],
    })
    const a = estimateStrengthCalories(light)!
    const b = estimateStrengthCalories(heavy)!
    expect(b).toBeGreaterThan(a)
  })

  it('more reps → higher kcal', () => {
    const few = makeInput({
      exercises: [makeExercise({ sets: [makeSet({ weight_kg: 80, reps: 5 })] })],
    })
    const many = makeInput({
      exercises: [makeExercise({ sets: [makeSet({ weight_kg: 80, reps: 15 })] })],
    })
    expect(estimateStrengthCalories(many)!).toBeGreaterThan(estimateStrengthCalories(few)!)
  })

  it('compound (squat) > isolation (lateral_raise) at equal load / reps', () => {
    const set = () => makeSet({ weight_kg: 20, reps: 12 })
    const compound = makeInput({
      exercises: [makeExercise({ movementPattern: 'squat', sets: [set()] })],
    })
    const isolation = makeInput({
      exercises: [makeExercise({ movementPattern: 'lateral_raise', sets: [set()] })],
    })
    expect(estimateStrengthCalories(compound)!).toBeGreaterThan(
      estimateStrengthCalories(isolation)!,
    )
  })
})

// ─── ladder branches (movedMassKg) ─────────────────────────
describe('estimateStrengthCalories — ladder / bodyweight branches', () => {
  it('assisted set: LESS assist_kg → HIGHER kcal', () => {
    // 3×20 rather than a single 8-rep set: the assist delta must show through the
    // round-to-5 output grid. After the 2026-09-27 recalibration a single light
    // set put both cases in the same 5-kcal bucket (raw 9.4 vs 12.2, both →10),
    // masking a real difference. Same strict assertion, larger observable signal.
    const bigSets = (assist_kg: number) =>
      [1, 2, 3].map((n) => makeSet({ set_number: n, weight_kg: 0, reps: 20, assist_kg }))
    const base = makeExercise({
      movementPattern: 'vertical_pull',
      equipment: ['assisted-machine'],
    })
    const moreAssist = makeInput({
      exercises: [{ ...base, sets: bigSets(40) }],
    })
    const lessAssist = makeInput({
      exercises: [{ ...base, sets: bigSets(10) }],
    })
    expect(estimateStrengthCalories(lessAssist)!).toBeGreaterThan(
      estimateStrengthCalories(moreAssist)!,
    )
  })

  it('surface set: LOWER surface_level → HIGHER kcal', () => {
    const base = makeExercise({
      movementPattern: 'horizontal_press',
      equipment: ['bodyweight'],
    })
    const easy = makeInput({
      exercises: [{ ...base, sets: [makeSet({ weight_kg: 0, surface_level: 5 })] }],
    })
    const hard = makeInput({
      exercises: [{ ...base, sets: [makeSet({ weight_kg: 0, surface_level: 1 })] }],
    })
    expect(estimateStrengthCalories(hard)!).toBeGreaterThan(
      estimateStrengthCalories(easy)!,
    )
  })

  it('bodyweight equipment with weight_kg = 0 → non-zero kcal', () => {
    const ex = makeExercise({
      movementPattern: 'horizontal_press',
      equipment: ['bodyweight'],
      sets: [makeSet({ weight_kg: 0 })],
    })
    const kcal = estimateStrengthCalories(makeInput({ exercises: [ex] }))
    expect(kcal).not.toBeNull()
    expect(kcal!).toBeGreaterThan(0)
  })

  it('full ladder session (all weight_kg = 0, assist or surface) → non-zero kcal', () => {
    const assisted = makeExercise({
      movementPattern: 'vertical_pull',
      equipment: ['assisted-machine'],
      sets: [makeSet({ weight_kg: 0, assist_kg: 25 })],
    })
    const surface = makeExercise({
      movementPattern: 'horizontal_press',
      equipment: ['bodyweight'],
      sets: [makeSet({ weight_kg: 0, surface_level: 2 })],
    })
    const kcal = estimateStrengthCalories(makeInput({ exercises: [assisted, surface] }))
    expect(kcal).not.toBeNull()
    expect(kcal!).toBeGreaterThan(0)
  })
})

// ─── warm-up, effort, rest modifiers ───────────────────────
describe('estimateStrengthCalories — modifiers', () => {
  it('warmupDone = true adds exactly WARMUP_KCAL (25) vs false', () => {
    // Math.round((x + 25)/5)*5 === Math.round(x/5)*5 + 25 for any x, since 25/5
    // is an integer — so the warm-up allowance never crosses the round boundary.
    const without = estimateStrengthCalories(makeInput({ warmupDone: false }))!
    const withWarmup = estimateStrengthCalories(makeInput({ warmupDone: true }))!
    expect(withWarmup).toBe(without + 25)
  })

  it('rir below targetRir → higher than at target, and bonus caps at MAX_EFFORT_BONUS', () => {
    // Heavy, high-volume set so the ≤12% bonus is well above the round-to-5
    // granularity (active work dominates, rest term is small).
    const heavySet = (over: Partial<ExerciseSet> = {}) =>
      makeSet({ weight_kg: 300, reps: 20, ...over })

    const atTarget = makeInput({
      exercises: [makeExercise({ targetRir: 5, sets: [heavySet({ rir: 5 })] })],
    })
    // overreach 5 → 5*0.04 = 0.20, clamped to 0.12
    const cappedA = makeInput({
      exercises: [makeExercise({ targetRir: 5, sets: [heavySet({ rir: 0 })] })],
    })
    // overreach 4 → 4*0.04 = 0.16, also clamped to 0.12
    const cappedB = makeInput({
      exercises: [makeExercise({ targetRir: 5, sets: [heavySet({ rir: 1 })] })],
    })

    const base = estimateStrengthCalories(atTarget)!
    const a = estimateStrengthCalories(cappedA)!
    const b = estimateStrengthCalories(cappedB)!

    expect(a).toBeGreaterThan(base) // grinding past target burns more
    expect(a).toBe(b) // ...but the bonus is clamped, so 0.20 and 0.16 match
  })

  it('longer restSeconds → higher kcal; restSeconds = null uses DEFAULT_REST_S (90)', () => {
    const shortRest = makeInput({
      exercises: [makeExercise({ restSeconds: 60 })],
    })
    const longRest = makeInput({
      exercises: [makeExercise({ restSeconds: 600 })],
    })
    expect(estimateStrengthCalories(longRest)!).toBeGreaterThan(
      estimateStrengthCalories(shortRest)!,
    )

    const nullRest = makeInput({ exercises: [makeExercise({ restSeconds: null })] })
    const default90 = makeInput({ exercises: [makeExercise({ restSeconds: 90 })] })
    expect(estimateStrengthCalories(nullRest)).toBe(estimateStrengthCalories(default90))
  })

  it('unknown movementPattern → finite, non-null kcal (DEFAULT_PROFILE fallback)', () => {
    const ex = makeExercise({
      movementPattern: 'not_a_real_pattern',
      sets: [makeSet({ weight_kg: 50, reps: 8 })],
    })
    const kcal = estimateStrengthCalories(makeInput({ exercises: [ex] }))
    expect(kcal).not.toBeNull()
    expect(Number.isFinite(kcal!)).toBe(true)
  })
})

// ─── golden + invariants ───────────────────────────────────
describe('estimateStrengthCalories — golden fixture & invariants', () => {
  it('locks the exact kcal for one fully-specified set', () => {
    // One squat set, bodyweight 80 kg, 100 kg × 5 reps, 90 s rest, no rir bonus,
    // no warm-up. Hand-computed from the module constants.
    //
    // RECALIBRATED 2026-09-27: EFF 0.20→0.18, ECCENTRIC 0.35→0.50, REST_MET
    // 2.5→3.2 lifted a moderate mixed session from ~120 into the defensible
    // 150-250 kcal band. This golden expectation was re-derived from the new
    // constants (was 10 kcal under the old ones):
    //   mass      = weight_kg + bw*loadedBwFrac = 100 + 80*0.65        = 152 kg
    //   workJ     = mass * G * rom * reps = 152 * 9.81 * 0.50 * 5       = 3727.8 J
    //   activeKcal= workJ * (1+ECCENTRIC 0.50) / EFF 0.18 / 4184
    //             = 3727.8 * 1.50 / 0.18 / 4184                        ≈ 7.4247 kcal
    //   restKcal  = REST_MET 3.2 * bw 80 * (90/3600)                   = 6.4 kcal
    //   total     = 13.8247 → round(13.8247/5)*5                       = 15
    const input = makeInput({
      bodyweightKg: 80,
      warmupDone: false,
      exercises: [
        makeExercise({
          movementPattern: 'squat', // rom 0.50, loadedBwFrac 0.65
          equipment: ['barbell'],
          restSeconds: 90,
          targetRir: null,
          sets: [makeSet({ weight_kg: 100, reps: 5 })],
        }),
      ],
    })
    expect(estimateStrengthCalories(input)).toBe(15)
  })

  it('output is always a multiple of 5 when non-null', () => {
    const kcal = estimateStrengthCalories(
      makeInput({
        exercises: [makeExercise({ sets: [makeSet({ weight_kg: 73, reps: 9 })] })],
      }),
    )
    expect(kcal).not.toBeNull()
    expect(kcal! % 5).toBe(0)
  })
})
