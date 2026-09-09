// ─── Exercise Logging ──────────────────────────────────────
export interface ExerciseSet {
  set_number: number
  weight_kg: number
  reps: number
  rir?: number
  notes?: string
}

// ─── Plan Exercise (used in generated plans) ──────────────
export interface PlanExerciseEntry {
  exerciseId: string
  targetSets: number
  targetRepsMin: number
  targetRepsMax: number
  targetRir: number
  restSeconds: number
  progressionRule: 'linear' | 'double-progression'
  notes: string
  alternatives: string[]
}

export interface PlanWarmupEntry {
  exerciseId: string
  sets: number
  reps: string
  notes: string
}

export interface PlanCoreEntry {
  exerciseId: string
  sets: number
  reps: string
}

export interface PlanCardio {
  type: string
  durationMinutes: number
  intensity: 'low' | 'moderate' | 'high'
  notes: string
}

export type DayType = 'strength' | 'cardio' | 'hiit' | 'rest'

export interface GeneratedDayPlan {
  dayOfWeek: string
  dayLabel: string
  type: DayType
  warmup: PlanWarmupEntry[]
  mainExercises: PlanExerciseEntry[]
  accessories: PlanExerciseEntry[]
  coreFinisher: PlanCoreEntry[]
  cardio: PlanCardio | null
  cooldown: string
  estimatedMinutes: number
}

export interface GeneratedPhase {
  phaseNumber: number
  weekStart: number
  weekEnd: number
  name: string
  description: string
  weeklySchedule: GeneratedDayPlan[]
  progressionStrategy: string
  deloadWeek: number | null
}

export interface PlanOverloadRules {
  linearProgression: string
  doubleProgression: string
  failureProtocol: string
  deloadProtocol: string
}

export interface GeneratedWorkoutPlan {
  planName: string
  totalWeeks: number
  phases: GeneratedPhase[]
  overloadRules: PlanOverloadRules
  rationale: string
}

// ─── Legacy types (kept for backward compat with existing code) ─
export interface OverloadRules {
  weight_increment_kg: number
  rep_target_min: number
  rep_target_max: number
  deload_frequency_weeks: number
}

export interface DayPlan {
  day: string
  focus: string
  exercises: PlanExercise[]
}

export interface PlanExercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  notes?: string
}

export interface Phase {
  phaseNumber: number
  weekStart: number
  weekEnd: number
  name: string
  description: string
  weeklySchedule: DayPlan[]
}

export interface WorkoutPlan {
  planName: string
  totalWeeks: number
  phases: Phase[]
  overloadRules: OverloadRules
}
