import type { ExerciseSet, PlanExerciseEntry, PlanOverloadRules } from '../../lib/types'

export interface Recommendation {
  recommendedWeight: number
  recommendedReps: number
  reason: string
}

interface SessionSummary {
  date: string
  sets: ExerciseSet[]
}

const WEIGHT_INCREMENT = 2.5
const MIN_WEIGHT_INCREMENT = 1.25

function avgReps(sets: ExerciseSet[]): number {
  if (sets.length === 0) return 0
  return sets.reduce((sum, s) => sum + s.reps, 0) / sets.length
}


function topSetWeight(sets: ExerciseSet[]): number {
  if (sets.length === 0) return 0
  return sets[0].weight_kg
}

function allSetsHitTarget(sets: ExerciseSet[], targetRepsMax: number): boolean {
  return sets.length > 0 && sets.every((s) => s.reps >= targetRepsMax)
}

function allSetsHitMin(sets: ExerciseSet[], targetRepsMin: number): boolean {
  return sets.length > 0 && sets.every((s) => s.reps >= targetRepsMin)
}

function consecutiveFailures(sessions: SessionSummary[], targetRepsMin: number): number {
  let count = 0
  for (const session of sessions) {
    if (!allSetsHitMin(session.sets, targetRepsMin)) {
      count++
    } else {
      break
    }
  }
  return count
}

// The five coach progression verbs (+ two legacy generator values) collapse to
// these five canonical rules. Anything unrecognised maps to double_progression —
// the safe general default — so a stray value can NEVER produce "no
// recommendation" (the explicit failure mode we must avoid).
type CanonicalProgression =
  | 'double_progression'
  | 'novice_linear'
  | 'load_progression'
  | 'rep_progression'
  | 'assist_reduction'

function canonicalProgression(rule: string): CanonicalProgression {
  switch (rule) {
    case 'double_progression':
    case 'double-progression': // legacy hyphenated form
      return 'double_progression'
    case 'load_progression':
      return 'load_progression'
    case 'rep_progression':
      return 'rep_progression'
    case 'assist_reduction':
      return 'assist_reduction'
    case 'novice_linear':
    case 'linear': // legacy generator "linear" == add load while form holds
      return 'novice_linear'
    default:
      return 'double_progression'
  }
}

export function getRecommendation(
  exercise: PlanExerciseEntry,
  lastSessions: SessionSummary[],
  _overloadRules: PlanOverloadRules,
  isDeloadWeek: boolean,
): Recommendation {
  const rule = canonicalProgression(exercise.progressionRule)

  if (lastSessions.length === 0) {
    if (rule === 'assist_reduction') {
      return {
        recommendedWeight: 0,
        recommendedReps: exercise.targetRepsMin,
        reason:
          'First session — set the help (or surface height) so the target reps are hard but doable with good form. You get stronger by needing LESS help / a lower surface over time, never by adding weight.',
      }
    }
    return {
      recommendedWeight: 0,
      recommendedReps: exercise.targetRepsMin,
      reason: 'First session — start light and focus on form',
    }
  }

  const latest = lastSessions[0]
  const lastWeight = topSetWeight(latest.sets)
  const lastAvgReps = avgReps(latest.sets)

  // assist_reduction: a bodyweight ladder (assisted pull-up / incline push-up).
  // Load is NOT the lever — hold it and progress by taking assistance off or
  // lowering the surface. Never auto-bump load, never "drop weight" on a miss.
  if (rule === 'assist_reduction') {
    if (isDeloadWeek) {
      return {
        recommendedWeight: lastWeight,
        recommendedReps: exercise.targetRepsMin,
        reason: 'Recovery week — give yourself a bit more help (or a higher surface) and keep the sets easy',
      }
    }
    return {
      recommendedWeight: lastWeight,
      recommendedReps: exercise.targetRepsMax,
      reason: `Get better by using a notch less help (or a lower surface) — not by adding weight. Nail ${exercise.targetRepsMin}-${exercise.targetRepsMax} clean reps, then take some help away.`,
    }
  }

  if (isDeloadWeek) {
    // Bodyweight / timed exercises log weight_kg = 0. Applying the 60% deload
    // formula would recommend "0kg (60% of last)" — nonsensical. Short-circuit
    // to the rep-progression deload: hold the load, ease the reps.
    if (lastWeight === 0) {
      return {
        recommendedWeight: 0,
        recommendedReps: exercise.targetRepsMin,
        reason: 'Recovery week — keep it easy, aim for the lower end of the rep range',
      }
    }
    const deloadWeight = Math.round((lastWeight * 0.6) / MIN_WEIGHT_INCREMENT) * MIN_WEIGHT_INCREMENT
    return {
      recommendedWeight: deloadWeight,
      recommendedReps: exercise.targetRepsMin,
      reason: `Recovery week — ${Math.round(deloadWeight)}kg (about 60% of last time, on purpose)`,
    }
  }

  // A fixed-load rep ladder (planks, dead-bug, hanging-leg-raise) never drops
  // "weight" on a miss — you just hold the reps — so the failure-deload only
  // applies to the load-based rules.
  const failures = consecutiveFailures(lastSessions, exercise.targetRepsMin)
  if (failures >= 2 && rule !== 'rep_progression') {
    const reducedWeight = Math.max(
      0,
      Math.round((lastWeight * 0.9) / MIN_WEIGHT_INCREMENT) * MIN_WEIGHT_INCREMENT,
    )
    return {
      recommendedWeight: reducedWeight,
      recommendedReps: exercise.targetRepsMin,
      reason: `2 sessions below target — drop to ${reducedWeight}kg and rebuild`,
    }
  }

  switch (rule) {
    case 'double_progression': {
      // Earn the top of the rep range on every set, THEN add load and reset low.
      if (allSetsHitTarget(latest.sets, exercise.targetRepsMax)) {
        const newWeight = lastWeight + WEIGHT_INCREMENT
        return {
          recommendedWeight: newWeight,
          recommendedReps: exercise.targetRepsMin,
          reason: `Hit ${exercise.targetRepsMax} reps on all sets — increase to ${newWeight}kg`,
        }
      }
      return {
        recommendedWeight: lastWeight,
        recommendedReps: Math.min(Math.round(lastAvgReps) + 1, exercise.targetRepsMax),
        reason: `Add reps at ${lastWeight}kg until you hit ${exercise.targetRepsMax} on all sets`,
      }
    }

    case 'load_progression': {
      // Strength block: keep reps in a low band, push the load once the rep
      // floor is cleared on all sets.
      if (allSetsHitMin(latest.sets, exercise.targetRepsMin)) {
        const newWeight = lastWeight + WEIGHT_INCREMENT
        return {
          recommendedWeight: newWeight,
          recommendedReps: exercise.targetRepsMin,
          reason: `Cleared ${exercise.targetRepsMin}+ on all sets — add weight to ${newWeight}kg, keep reps ${exercise.targetRepsMin}-${exercise.targetRepsMax}`,
        }
      }
      return {
        recommendedWeight: lastWeight,
        recommendedReps: exercise.targetRepsMin,
        reason: `Hold ${lastWeight}kg until every set clears ${exercise.targetRepsMin} reps, then add weight`,
      }
    }

    case 'rep_progression': {
      // Fixed load, add reps toward the top of the range (bodyweight/timed core).
      const nextReps = Math.min(Math.round(lastAvgReps) + 1, exercise.targetRepsMax)
      return {
        recommendedWeight: lastWeight,
        recommendedReps: nextReps,
        reason:
          lastAvgReps >= exercise.targetRepsMax
            ? `Owning ${exercise.targetRepsMax} — make it harder (more weight, slower reps, or fuller range), then build the reps back up`
            : `Same load — add reps toward ${exercise.targetRepsMax} (progress by reps, not weight)`,
      }
    }

    case 'novice_linear':
    default: {
      // Novice linear: add load every session the rep floor + form hold.
      if (allSetsHitMin(latest.sets, exercise.targetRepsMin)) {
        const newWeight = lastWeight + WEIGHT_INCREMENT
        return {
          recommendedWeight: newWeight,
          recommendedReps: exercise.targetRepsMin,
          reason: `Good progress — increase to ${newWeight}kg`,
        }
      }
      return {
        recommendedWeight: lastWeight,
        recommendedReps: exercise.targetRepsMin,
        reason: `Stay at ${lastWeight}kg — aim for ${exercise.targetRepsMin}+ reps on all sets`,
      }
    }
  }
}

export function formatLastSession(sets: ExerciseSet[]): string {
  if (sets.length === 0) return 'No previous data'
  const weight = sets[0].weight_kg
  const reps = sets.map((s) => s.reps).join(', ')
  return `${weight}kg × ${reps}`
}

export function setComparison(
  current: ExerciseSet,
  lastSets: ExerciseSet[],
): 'up' | 'same' | 'down' | null {
  const lastSet = lastSets.find((s) => s.set_number === current.set_number)
  if (!lastSet) return null
  const currentVolume = current.weight_kg * current.reps
  const lastVolume = lastSet.weight_kg * lastSet.reps
  if (currentVolume > lastVolume) return 'up'
  if (currentVolume < lastVolume) return 'down'
  return 'same'
}
