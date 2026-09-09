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

function maxWeight(sets: ExerciseSet[]): number {
  return Math.max(...sets.map((s) => s.weight_kg), 0)
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

export function getRecommendation(
  exercise: PlanExerciseEntry,
  lastSessions: SessionSummary[],
  _overloadRules: PlanOverloadRules,
  isDeloadWeek: boolean,
): Recommendation {
  if (lastSessions.length === 0) {
    return {
      recommendedWeight: 0,
      recommendedReps: exercise.targetRepsMin,
      reason: 'First session — start light and focus on form',
    }
  }

  const latest = lastSessions[0]
  const lastWeight = topSetWeight(latest.sets)
  const lastAvgReps = avgReps(latest.sets)

  if (isDeloadWeek) {
    const deloadWeight = Math.round((lastWeight * 0.6) / MIN_WEIGHT_INCREMENT) * MIN_WEIGHT_INCREMENT
    return {
      recommendedWeight: deloadWeight,
      recommendedReps: exercise.targetRepsMin,
      reason: `Deload week — ${Math.round(deloadWeight)}kg (60% of last)`,
    }
  }

  const failures = consecutiveFailures(lastSessions, exercise.targetRepsMin)
  if (failures >= 2) {
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

  if (exercise.progressionRule === 'double-progression') {
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

  // Linear progression
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
