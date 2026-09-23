// plan_data shape per AestheticFit-5month-training-architecture.md §"Encoding into the app".
// This is the generator's OUTPUT contract — stable identity for ProgressEngine +
// swap-immutability logic to key off.

export interface ExerciseRef {
  type: 'library' | 'custom'
  id: string
}

// Coach-authored plans (plan_data from the coach JSON) use five progression
// verbs; the deterministic generator/templates historically emit the two legacy
// values. ProgressEngine handles ALL of them (see canonicalProgression) — an
// unknown value must never fall through to "no recommendation".
export type ProgressionRule =
  // coach vocabulary
  | 'double_progression'
  | 'novice_linear'
  | 'load_progression'
  | 'rep_progression'
  | 'assist_reduction'
  // legacy generator vocabulary (planTemplates.ts) — kept valid for existing plans
  | 'linear'
  | 'double-progression'

export interface PlanSlotExercise {
  ref: ExerciseRef
  sets: number
  rep_low: number
  rep_high: number
  rir: number
  rest_s: number
  progression: ProgressionRule
  alternatives: ExerciseRef[]
  note?: string
}

export interface PlanDay {
  label: string
  split: string
  exercises: PlanSlotExercise[]
}

export interface PlanData {
  version: number
  phase: number
  total_phases: number
  days: PlanDay[]
}

// ─── exercise_library row (subset the generator needs) ───────────
export interface LibraryExercise {
  id: string
  name: string
  primary_muscle: string
  secondary_muscles: string[]
  movement_pattern: string
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  contraindications: string[]
  sfr_rating: number | null
  stability_demand: 'low' | 'medium' | 'high' | null
  alternatives: string[]
  /** Inadvisable for everyone (e.g. behind-the-neck variants) — excluded from
   * both primary selection and alternatives regardless of per-user injury tags. */
  deprecated: boolean
}

// ─── Data-driven slot spec: what a slot NEEDS, not a hardcoded exercise ───
export type LogicalMuscleTarget =
  | 'chest' | 'upper_chest'
  | 'back' | 'lats'
  | 'side_delt' | 'front_delt' | 'rear_delt'
  | 'quads' | 'hamstrings' | 'glutes'
  | 'biceps' | 'triceps'
  | 'core' | 'cardio' | 'calves'

export interface SlotSpec {
  /** logical target this slot fills, e.g. 'side_delt' */
  target: LogicalMuscleTarget
  /** acceptable movement_pattern values (either taxonomy) */
  movementPatterns: string[]
  sets: number
  repLow: number
  repHigh: number
  rir: number
  restSeconds: number
  progression: ProgressionRule
  note?: string
}

export interface DayTemplate {
  label: string
  split: string
  slots: SlotSpec[]
}

export interface PhaseTemplate {
  phaseNumber: number
  weekStart: number
  weekEnd: number
  name: string
  intent: string
  /** ordered list of day templates; cycles/repeats to fill the week */
  days: DayTemplate[]
  deloadWeek: number | null
}

export type GoalMode = 'recomp' | 'cut' | 'lean_bulk' | 'maintain'
