import type { AssessmentResponses } from '../profile/types'
import type {
  GeneratedWorkoutPlan,
  GeneratedPhase,
  GeneratedDayPlan,
  PlanExerciseEntry,
  PlanWarmupEntry,
  PlanCoreEntry,
  PlanCardio,
  PlanOverloadRules,
} from '../../lib/types'
import {
  EXERCISES,
  EXERCISE_MAP,
  type Exercise,
  type MuscleGroup,
  type EquipmentType,
} from '../../lib/constants/exercises'

// ─── Equipment mapping ─────────────────────────────────────
// Maps assessment equipment strings to exercise EquipmentType values
const EQUIPMENT_MAPPING: Record<string, EquipmentType[]> = {
  'Full Commercial Gym': [
    'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
    'band', 'kettlebell', 'ab_wheel', 'pull_up_bar', 'treadmill',
    'stationary_bike', 'elliptical',
  ],
  Dumbbells: ['dumbbell'],
  Barbells: ['barbell'],
  Cables: ['cable'],
  'Smith Machine': ['machine'],
  Machines: ['machine'],
  'Pull-up Bar': ['pull_up_bar'],
  Bench: ['dumbbell', 'barbell'],
  'Cardio Machines': ['treadmill', 'stationary_bike', 'elliptical'],
  'Resistance Bands': ['band'],
  'Swimming Pool': ['none'],
  'Badminton Court': ['none'],
}

// ─── Helpers ───────────────────────────────────────────────

function isBeginner(a: AssessmentResponses): boolean {
  const level = a.training.level.toLowerCase()
  const months = a.training.gym_months ?? 0
  return level.includes('beginner') || level.includes('some experience') || months < 6
}

function getAvailableEquipment(a: AssessmentResponses): Set<EquipmentType> {
  const set = new Set<EquipmentType>()
  set.add('bodyweight')
  set.add('none')
  for (const item of a.equipment) {
    const mapped = EQUIPMENT_MAPPING[item]
    if (mapped) mapped.forEach((e) => set.add(e))
  }
  return set
}

function hasInjuryFlag(injuries: string, ...keywords: string[]): boolean {
  const lower = injuries.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

function shouldExclude(
  ex: Exercise,
  cannotDo: string[],
  injuries: string,
  availableEquipment: Set<EquipmentType>,
): boolean {
  // Check equipment availability
  if (!ex.equipment.some((e) => availableEquipment.has(e))) return true

  // Check cannot-do list
  const cannotLower = cannotDo.map((s) => s.toLowerCase())
  if (cannotLower.some((c) => ex.name.toLowerCase().includes(c))) return true

  // Injury-based exclusions
  if (hasInjuryFlag(injuries, 'cervical', 'neck', 'spine')) {
    if (ex.flags?.behind_neck) return true
    if (ex.id === 'good-mornings') return true
  }

  if (hasInjuryFlag(injuries, 'grip', 'wrist', 'forearm')) {
    if (ex.flags?.heavy_grip_dependence) return true
  }

  return false
}

function pickExercise(
  muscle: MuscleGroup,
  pattern: string | null,
  exclude: Set<string>,
  cannotDo: string[],
  injuries: string,
  availableEquipment: Set<EquipmentType>,
  preference: string,
): Exercise | null {
  const candidates = EXERCISES.filter((ex) => {
    if (exclude.has(ex.id)) return false
    if (ex.primary_muscle !== muscle) return false
    if (pattern && ex.movement_pattern !== pattern) return false
    if (shouldExclude(ex, cannotDo, injuries, availableEquipment)) return false
    return true
  })

  if (candidates.length === 0) return null

  // Sort by preference
  candidates.sort((a, b) => {
    const aScore = preferenceScore(a, preference)
    const bScore = preferenceScore(b, preference)
    return bScore - aScore
  })

  return candidates[0]
}

function preferenceScore(ex: Exercise, preference: string): number {
  let score = 0
  if (preference === 'machines' && ex.equipment.includes('machine')) score += 2
  if (preference === 'machines' && ex.equipment.includes('cable')) score += 1
  if (preference === 'free-weights' && (ex.equipment.includes('barbell') || ex.equipment.includes('dumbbell'))) score += 2
  if (preference === 'bodyweight' && ex.equipment.includes('bodyweight')) score += 3
  if (ex.movement_pattern !== 'isolation') score += 1
  return score
}

function pickExercises(
  muscle: MuscleGroup,
  count: number,
  ctx: SelectionContext,
  patterns?: string[],
): Exercise[] {
  const result: Exercise[] = []
  const used = new Set(ctx.usedIds)

  for (let i = 0; i < count; i++) {
    const pat = patterns?.[i] ?? null
    const ex = pickExercise(
      muscle, pat, used, ctx.cannotDo, ctx.injuries,
      ctx.equipment, ctx.preference,
    )
    if (ex) {
      result.push(ex)
      used.add(ex.id)
    }
  }

  return result
}

interface SelectionContext {
  usedIds: Set<string>
  cannotDo: string[]
  injuries: string
  equipment: Set<EquipmentType>
  preference: string
}

function makeEntry(
  ex: Exercise,
  sets: number,
  repsMin: number,
  repsMax: number,
  rir: number,
  rest: number,
  progression: 'linear' | 'double-progression',
  notes: string = '',
): PlanExerciseEntry {
  const alts = ex.alternatives
    .filter((id) => EXERCISE_MAP.has(id))
    .slice(0, 3)

  return {
    exerciseId: ex.id,
    targetSets: sets,
    targetRepsMin: repsMin,
    targetRepsMax: repsMax,
    targetRir: rir,
    restSeconds: rest,
    progressionRule: progression,
    notes,
    alternatives: alts,
  }
}

function makeWarmup(id: string, sets: number, reps: string, notes: string = ''): PlanWarmupEntry {
  return { exerciseId: id, sets, reps, notes }
}

function makeCore(id: string, sets: number, reps: string): PlanCoreEntry {
  return { exerciseId: id, sets, reps }
}

function needsGluteActivation(a: AssessmentResponses): boolean {
  if (a.basics.sex === 'female') return true
  const goals = [a.goals.primary, a.goals.secondary ?? ''].join(' ').toLowerCase()
  return goals.includes('glute') || goals.includes('fat loss')
}

function pickCardio(a: AssessmentResponses, duration: number): PlanCardio | null {
  const prefs = a.lifestyle.cardio_preference.map((c) => c.toLowerCase())

  if (prefs.includes('none') || prefs.length === 0) return null

  let type = 'Treadmill Walk (Incline)'
  if (prefs.includes('cycling')) type = 'Stationary Bike'
  else if (prefs.includes('swimming')) type = 'Swimming'
  else if (prefs.includes('sports')) type = 'Badminton'
  else if (prefs.includes('running')) type = 'Treadmill Walk (Incline)'

  return {
    type,
    durationMinutes: duration,
    intensity: 'moderate',
    notes: 'Keep heart rate in zone 2 (conversational pace)',
  }
}

function buildGluteWarmup(): PlanWarmupEntry[] {
  return [
    makeWarmup('clamshell', 2, '15 each side'),
    makeWarmup('banded-glute-bridge', 2, '12'),
    makeWarmup('fire-hydrant', 2, '12 each side'),
  ]
}

function buildGeneralWarmup(): PlanWarmupEntry[] {
  return [
    makeWarmup('bird-dog', 2, '8 each side', 'Slow and controlled'),
    makeWarmup('dead-bug', 2, '8 each side'),
  ]
}

function pickCoreFinisher(used: Set<string>): PlanCoreEntry[] {
  const options = ['plank', 'dead-bug', 'side-plank', 'bird-dog', 'cable-woodchop', 'hanging-leg-raise', 'ab-wheel-rollout']
  const picked: PlanCoreEntry[] = []

  for (const id of options) {
    if (picked.length >= 2) break
    if (!used.has(id) && EXERCISE_MAP.has(id)) {
      picked.push(makeCore(id, 3, id === 'plank' || id === 'side-plank' ? '30-45 sec' : '10-12'))
      used.add(id)
    }
  }

  return picked
}

function restDay(dayOfWeek: string): GeneratedDayPlan {
  return {
    dayOfWeek,
    dayLabel: 'Rest Day',
    type: 'rest',
    warmup: [],
    mainExercises: [],
    accessories: [],
    coreFinisher: [],
    cardio: null,
    cooldown: '',
    estimatedMinutes: 0,
  }
}

function estimateMinutes(day: GeneratedDayPlan): number {
  if (day.type === 'rest') return 0
  const warmupMin = day.warmup.length * 2
  const mainMin = day.mainExercises.reduce((t, e) => t + e.targetSets * 1.5 + (e.restSeconds / 60) * (e.targetSets - 1), 0)
  const accMin = day.accessories.reduce((t, e) => t + e.targetSets * 1.2 + (e.restSeconds / 60) * (e.targetSets - 1), 0)
  const coreMin = day.coreFinisher.length * 3
  const cardioMin = day.cardio?.durationMinutes ?? 0
  return Math.round(warmupMin + mainMin + accMin + coreMin + cardioMin + 5)
}

// ─── Day builders ──────────────────────────────────────────

function buildFullBodyDay(
  label: string,
  dayOfWeek: string,
  variant: 'A' | 'B',
  a: AssessmentResponses,
  ctx: SelectionContext,
  volume: 'low' | 'moderate',
): GeneratedDayPlan {
  const usedInDay = new Set<string>()
  const localCtx = { ...ctx, usedIds: new Set(ctx.usedIds) }

  const warmup = needsGluteActivation(a) ? buildGluteWarmup() : buildGeneralWarmup()

  const main: PlanExerciseEntry[] = []
  const acc: PlanExerciseEntry[] = []

  const sets = volume === 'low' ? 3 : 4
  const rir = volume === 'low' ? 3 : 2

  if (variant === 'A') {
    // Squat pattern, horizontal push, horizontal pull
    const squat = pickExercises('quads', 1, localCtx, ['squat'])
    const push = pickExercises('chest', 1, localCtx, ['push'])
    const pull = pickExercises('back', 1, localCtx, ['pull'])
    const hinge = pickExercises('hamstrings', 1, localCtx, ['hinge'])

    for (const ex of [...squat, ...push, ...pull]) {
      main.push(makeEntry(ex, sets, 8, 12, rir, 120, 'linear'))
      localCtx.usedIds.add(ex.id)
    }
    for (const ex of hinge) {
      main.push(makeEntry(ex, sets, 8, 12, rir, 90, 'linear'))
      localCtx.usedIds.add(ex.id)
    }

    // Accessories
    const shoulders = pickExercises('shoulders', 1, localCtx, ['isolation'])
    const biceps = pickExercises('biceps', 1, localCtx)
    for (const ex of [...shoulders, ...biceps]) {
      acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }
  } else {
    // Hinge pattern, vertical push, vertical pull
    const hinge = pickExercises('hamstrings', 1, localCtx, ['hinge'])
    const push = pickExercises('shoulders', 1, localCtx, ['push'])
    const pull = pickExercises('back', 1, localCtx, ['pull'])
    const squat = pickExercises('quads', 1, localCtx, ['isolation'])

    for (const ex of [...hinge, ...push, ...pull]) {
      main.push(makeEntry(ex, sets, 8, 12, rir, 120, 'linear'))
      localCtx.usedIds.add(ex.id)
    }
    for (const ex of squat) {
      main.push(makeEntry(ex, sets, 10, 15, 2, 90, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }

    // Accessories
    const chest = pickExercises('chest', 1, localCtx, ['isolation'])
    const triceps = pickExercises('triceps', 1, localCtx)
    for (const ex of [...chest, ...triceps]) {
      acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }
  }

  const coreFinisher = pickCoreFinisher(usedInDay)

  const day: GeneratedDayPlan = {
    dayOfWeek,
    dayLabel: label,
    type: 'strength',
    warmup,
    mainExercises: main,
    accessories: acc,
    coreFinisher,
    cardio: null,
    cooldown: '5 min stretching — focus on muscles worked',
    estimatedMinutes: 0,
  }
  day.estimatedMinutes = estimateMinutes(day)
  return day
}

function buildUpperDay(
  label: string,
  dayOfWeek: string,
  variant: 'A' | 'B',
  _a: AssessmentResponses,
  ctx: SelectionContext,
  volume: 'moderate' | 'high',
): GeneratedDayPlan {
  const localCtx = { ...ctx, usedIds: new Set(ctx.usedIds) }
  const warmup = buildGeneralWarmup()
  const main: PlanExerciseEntry[] = []
  const acc: PlanExerciseEntry[] = []

  const sets = volume === 'moderate' ? 3 : 4
  const rir = volume === 'moderate' ? 2 : 1

  if (variant === 'A') {
    // Horizontal focus
    const chestCompound = pickExercises('chest', 1, localCtx, ['push'])
    const backCompound = pickExercises('back', 1, localCtx, ['pull'])
    const shoulderPress = pickExercises('shoulders', 1, localCtx, ['push'])

    for (const ex of [...chestCompound, ...backCompound, ...shoulderPress]) {
      main.push(makeEntry(ex, sets, 6, 10, rir, 120, 'linear'))
      localCtx.usedIds.add(ex.id)
    }

    const chestIso = pickExercises('chest', 1, localCtx, ['isolation'])
    const laterals = pickExercises('shoulders', 1, localCtx, ['isolation'])
    const biceps = pickExercises('biceps', 1, localCtx)
    const triceps = pickExercises('triceps', 1, localCtx)

    for (const ex of [...chestIso, ...laterals, ...biceps, ...triceps]) {
      acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }
  } else {
    // Vertical focus
    const pullVertical = pickExercises('back', 1, localCtx, ['pull'])
    const rearDelt = pickExercises('shoulders', 1, localCtx, ['isolation'])
    const chestCompound = pickExercises('chest', 1, localCtx, ['push'])

    for (const ex of [...pullVertical, ...chestCompound]) {
      main.push(makeEntry(ex, sets, 6, 10, rir, 120, 'linear'))
      localCtx.usedIds.add(ex.id)
    }

    const backRow = pickExercises('back', 1, localCtx, ['pull'])
    for (const ex of backRow) {
      main.push(makeEntry(ex, sets, 8, 12, rir, 90, 'linear'))
      localCtx.usedIds.add(ex.id)
    }

    for (const ex of rearDelt) {
      acc.push(makeEntry(ex, 3, 12, 20, 1, 45, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }

    const laterals = pickExercises('shoulders', 1, localCtx, ['isolation'])
    const hammer = pickExercises('biceps', 1, localCtx)
    const triceps = pickExercises('triceps', 1, localCtx)

    for (const ex of [...laterals, ...hammer, ...triceps]) {
      acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }
  }

  // Face pulls on every upper day
  const facePull = EXERCISE_MAP.get('face-pulls')
  if (facePull && !shouldExclude(facePull, ctx.cannotDo, ctx.injuries, ctx.equipment)) {
    acc.push(makeEntry(facePull, 3, 15, 20, 1, 45, 'double-progression', 'Shoulder health'))
  }

  const coreFinisher = pickCoreFinisher(new Set<string>())

  const day: GeneratedDayPlan = {
    dayOfWeek,
    dayLabel: label,
    type: 'strength',
    warmup,
    mainExercises: main,
    accessories: acc,
    coreFinisher,
    cardio: null,
    cooldown: '5 min upper body stretching',
    estimatedMinutes: 0,
  }
  day.estimatedMinutes = estimateMinutes(day)
  return day
}

function buildLowerDay(
  label: string,
  dayOfWeek: string,
  variant: 'A' | 'B',
  a: AssessmentResponses,
  ctx: SelectionContext,
  volume: 'moderate' | 'high',
): GeneratedDayPlan {
  const localCtx = { ...ctx, usedIds: new Set(ctx.usedIds) }
  const warmup = needsGluteActivation(a) ? buildGluteWarmup() : buildGeneralWarmup()
  const main: PlanExerciseEntry[] = []
  const acc: PlanExerciseEntry[] = []

  const sets = volume === 'moderate' ? 3 : 4
  const rir = volume === 'moderate' ? 2 : 1

  if (variant === 'A') {
    // Quad focus
    const squat = pickExercises('quads', 1, localCtx, ['squat'])
    for (const ex of squat) {
      main.push(makeEntry(ex, sets, 6, 10, rir, 150, 'linear'))
      localCtx.usedIds.add(ex.id)
    }

    const legPress = pickExercises('quads', 1, localCtx, ['squat'])
    for (const ex of legPress) {
      main.push(makeEntry(ex, sets, 8, 12, rir, 120, 'linear'))
      localCtx.usedIds.add(ex.id)
    }

    const rdl = pickExercises('hamstrings', 1, localCtx, ['hinge'])
    for (const ex of rdl) {
      main.push(makeEntry(ex, sets, 8, 12, rir, 120, 'linear'))
      localCtx.usedIds.add(ex.id)
    }

    const legExt = pickExercises('quads', 1, localCtx, ['isolation'])
    const legCurl = pickExercises('hamstrings', 1, localCtx, ['isolation'])
    for (const ex of [...legExt, ...legCurl]) {
      acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }
  } else {
    // Glute/ham focus
    const hipHinge = pickExercises('glutes', 1, localCtx, ['hinge'])
    for (const ex of hipHinge) {
      main.push(makeEntry(ex, sets, 8, 12, rir, 120, 'linear'))
      localCtx.usedIds.add(ex.id)
    }

    const squat = pickExercises('quads', 1, localCtx, ['squat'])
    for (const ex of squat) {
      main.push(makeEntry(ex, sets, 8, 12, rir, 120, 'linear'))
      localCtx.usedIds.add(ex.id)
    }

    const hamCurl = pickExercises('hamstrings', 1, localCtx, ['isolation'])
    for (const ex of hamCurl) {
      main.push(makeEntry(ex, sets, 10, 15, 2, 90, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }

    const gluteIso = pickExercises('glutes', 1, localCtx, ['hinge'])
    for (const ex of gluteIso) {
      acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }

    const splitSquat = pickExercises('quads', 1, localCtx, ['squat'])
    for (const ex of splitSquat) {
      acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
      localCtx.usedIds.add(ex.id)
    }
  }

  const coreFinisher = pickCoreFinisher(new Set<string>())

  const cardio = pickCardio(a, 10)

  const day: GeneratedDayPlan = {
    dayOfWeek,
    dayLabel: label,
    type: 'strength',
    warmup,
    mainExercises: main,
    accessories: acc,
    coreFinisher,
    cardio,
    cooldown: '5 min lower body stretching — hamstrings, hip flexors, quads',
    estimatedMinutes: 0,
  }
  day.estimatedMinutes = estimateMinutes(day)
  return day
}

function buildPushDay(
  dayOfWeek: string,
  _a: AssessmentResponses,
  ctx: SelectionContext,
): GeneratedDayPlan {
  const localCtx = { ...ctx, usedIds: new Set(ctx.usedIds) }
  const warmup = buildGeneralWarmup()
  const main: PlanExerciseEntry[] = []
  const acc: PlanExerciseEntry[] = []

  const chestCompound = pickExercises('chest', 2, localCtx, ['push', 'push'])
  for (const ex of chestCompound) {
    main.push(makeEntry(ex, 4, 6, 10, 2, 120, 'linear'))
    localCtx.usedIds.add(ex.id)
  }

  const shoulderPress = pickExercises('shoulders', 1, localCtx, ['push'])
  for (const ex of shoulderPress) {
    main.push(makeEntry(ex, 3, 8, 12, 2, 90, 'linear'))
    localCtx.usedIds.add(ex.id)
  }

  const chestIso = pickExercises('chest', 1, localCtx, ['isolation'])
  const laterals = pickExercises('shoulders', 1, localCtx, ['isolation'])
  const triceps = pickExercises('triceps', 2, localCtx)

  for (const ex of [...chestIso, ...laterals, ...triceps]) {
    acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
    localCtx.usedIds.add(ex.id)
  }

  const coreFinisher = pickCoreFinisher(new Set<string>())

  const day: GeneratedDayPlan = {
    dayOfWeek,
    dayLabel: 'Push',
    type: 'strength',
    warmup,
    mainExercises: main,
    accessories: acc,
    coreFinisher,
    cardio: null,
    cooldown: '5 min stretching — chest, shoulders, triceps',
    estimatedMinutes: 0,
  }
  day.estimatedMinutes = estimateMinutes(day)
  return day
}

function buildPullDay(
  dayOfWeek: string,
  _a: AssessmentResponses,
  ctx: SelectionContext,
): GeneratedDayPlan {
  const localCtx = { ...ctx, usedIds: new Set(ctx.usedIds) }
  const warmup = buildGeneralWarmup()
  const main: PlanExerciseEntry[] = []
  const acc: PlanExerciseEntry[] = []

  const backCompound = pickExercises('back', 2, localCtx, ['pull', 'pull'])
  for (const ex of backCompound) {
    main.push(makeEntry(ex, 4, 6, 10, 2, 120, 'linear'))
    localCtx.usedIds.add(ex.id)
  }

  const rearDelt = pickExercises('shoulders', 1, localCtx, ['isolation'])
  for (const ex of rearDelt) {
    acc.push(makeEntry(ex, 3, 12, 20, 1, 45, 'double-progression'))
    localCtx.usedIds.add(ex.id)
  }

  const facePull = EXERCISE_MAP.get('face-pulls')
  if (facePull && !shouldExclude(facePull, ctx.cannotDo, ctx.injuries, ctx.equipment)) {
    acc.push(makeEntry(facePull, 3, 15, 20, 1, 45, 'double-progression', 'Shoulder health'))
  }

  const biceps = pickExercises('biceps', 2, localCtx)
  for (const ex of biceps) {
    acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
    localCtx.usedIds.add(ex.id)
  }

  const coreFinisher = pickCoreFinisher(new Set<string>())

  const day: GeneratedDayPlan = {
    dayOfWeek,
    dayLabel: 'Pull',
    type: 'strength',
    warmup,
    mainExercises: main,
    accessories: acc,
    coreFinisher,
    cardio: null,
    cooldown: '5 min stretching — lats, biceps, rear delts',
    estimatedMinutes: 0,
  }
  day.estimatedMinutes = estimateMinutes(day)
  return day
}

function buildLegsPPL(
  dayOfWeek: string,
  a: AssessmentResponses,
  ctx: SelectionContext,
): GeneratedDayPlan {
  const localCtx = { ...ctx, usedIds: new Set(ctx.usedIds) }
  const warmup = needsGluteActivation(a) ? buildGluteWarmup() : buildGeneralWarmup()
  const main: PlanExerciseEntry[] = []
  const acc: PlanExerciseEntry[] = []

  const squat = pickExercises('quads', 1, localCtx, ['squat'])
  for (const ex of squat) {
    main.push(makeEntry(ex, 4, 6, 10, 2, 150, 'linear'))
    localCtx.usedIds.add(ex.id)
  }

  const rdl = pickExercises('hamstrings', 1, localCtx, ['hinge'])
  for (const ex of rdl) {
    main.push(makeEntry(ex, 4, 8, 12, 2, 120, 'linear'))
    localCtx.usedIds.add(ex.id)
  }

  const legPress = pickExercises('quads', 1, localCtx, ['squat'])
  for (const ex of legPress) {
    main.push(makeEntry(ex, 3, 10, 15, 2, 120, 'double-progression'))
    localCtx.usedIds.add(ex.id)
  }

  const legExt = pickExercises('quads', 1, localCtx, ['isolation'])
  const legCurl = pickExercises('hamstrings', 1, localCtx, ['isolation'])
  const gluteEx = pickExercises('glutes', 1, localCtx, ['hinge'])

  for (const ex of [...legExt, ...legCurl, ...gluteEx]) {
    acc.push(makeEntry(ex, 3, 10, 15, 2, 60, 'double-progression'))
    localCtx.usedIds.add(ex.id)
  }

  const coreFinisher = pickCoreFinisher(new Set<string>())

  const day: GeneratedDayPlan = {
    dayOfWeek,
    dayLabel: 'Legs',
    type: 'strength',
    warmup,
    mainExercises: main,
    accessories: acc,
    coreFinisher,
    cardio: pickCardio(a, 10),
    cooldown: '5 min stretching — quads, hamstrings, hip flexors, glutes',
    estimatedMinutes: 0,
  }
  day.estimatedMinutes = estimateMinutes(day)
  return day
}

function buildCardioDay(dayOfWeek: string, a: AssessmentResponses): GeneratedDayPlan {
  const cardio = pickCardio(a, 30) ?? {
    type: 'Treadmill Walk (Incline)',
    durationMinutes: 30,
    intensity: 'moderate' as const,
    notes: 'Zone 2 cardio — conversational pace',
  }

  return {
    dayOfWeek,
    dayLabel: 'Active Recovery / Cardio',
    type: 'cardio',
    warmup: [],
    mainExercises: [],
    accessories: [],
    coreFinisher: [],
    cardio,
    cooldown: '5 min stretching and foam rolling',
    estimatedMinutes: cardio.durationMinutes + 10,
  }
}

// ─── Schedule helpers ──────────────────────────────────────

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function mapPreferredDays(preferred: string[]): string[] {
  return preferred.map((d) => d.toLowerCase()).filter((d) => ALL_DAYS.includes(d))
}

function assignDays(preferred: string[], count: number): string[] {
  const mapped = mapPreferredDays(preferred)

  if (mapped.length >= count) return mapped.slice(0, count)

  // Default spreads
  const defaults: Record<number, string[]> = {
    3: ['monday', 'wednesday', 'friday'],
    4: ['monday', 'tuesday', 'thursday', 'friday'],
    5: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday'],
    6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  }

  return defaults[count] ?? defaults[4]
}

function fillWeek(trainingDays: GeneratedDayPlan[], cardioDay: GeneratedDayPlan | null): GeneratedDayPlan[] {
  const usedDays = new Set(trainingDays.map((d) => d.dayOfWeek))
  const week: GeneratedDayPlan[] = [...trainingDays]

  for (const day of ALL_DAYS) {
    if (!usedDays.has(day)) {
      if (cardioDay && !week.some((d) => d.type === 'cardio')) {
        week.push({ ...cardioDay, dayOfWeek: day })
      } else {
        week.push(restDay(day))
      }
    }
  }

  week.sort((a, b) => ALL_DAYS.indexOf(a.dayOfWeek) - ALL_DAYS.indexOf(b.dayOfWeek))
  return week
}

// ─── Phase builders ────────────────────────────────────────

function buildBeginnerPhases(a: AssessmentResponses, ctx: SelectionContext): GeneratedPhase[] {
  const days3 = assignDays(a.availability.preferred_days, 3)
  const days4 = assignDays(a.availability.preferred_days, 4)
  const wantsFatLoss = a.goals.primary.toLowerCase().includes('fat loss')
  const cardioDay = wantsFatLoss ? buildCardioDay('saturday', a) : null

  // Phase 1: Foundation Full Body (weeks 1-4)
  const p1Days: GeneratedDayPlan[] = [
    buildFullBodyDay('Full Body A', days3[0], 'A', a, ctx, 'low'),
    buildFullBodyDay('Full Body B', days3[1], 'B', a, ctx, 'low'),
    buildFullBodyDay('Full Body A', days3[2], 'A', a, ctx, 'low'),
  ]

  // Phase 2: Full Body + Volume (weeks 5-8)
  const p2Days: GeneratedDayPlan[] = [
    buildFullBodyDay('Full Body A', days3[0], 'A', a, ctx, 'moderate'),
    buildFullBodyDay('Full Body B', days3[1], 'B', a, ctx, 'moderate'),
    buildFullBodyDay('Full Body A', days3[2], 'A', a, ctx, 'moderate'),
  ]

  // Phase 3: Upper/Lower (weeks 9-12)
  const p3Days: GeneratedDayPlan[] = [
    buildUpperDay('Upper A', days4[0], 'A', a, ctx, 'moderate'),
    buildLowerDay('Lower A', days4[1], 'A', a, ctx, 'moderate'),
    buildUpperDay('Upper B', days4[2], 'B', a, ctx, 'moderate'),
    buildLowerDay('Lower B', days4[3], 'B', a, ctx, 'moderate'),
  ]

  // Phase 4: Upper/Lower + Volume (weeks 13-16)
  const p4Days: GeneratedDayPlan[] = [
    buildUpperDay('Upper A', days4[0], 'A', a, ctx, 'high'),
    buildLowerDay('Lower A', days4[1], 'A', a, ctx, 'high'),
    buildUpperDay('Upper B', days4[2], 'B', a, ctx, 'high'),
    buildLowerDay('Lower B', days4[3], 'B', a, ctx, 'high'),
  ]

  return [
    {
      phaseNumber: 1,
      weekStart: 1,
      weekEnd: 4,
      name: 'Foundation Full Body',
      description: 'Building movement patterns and base strength with 3 full body sessions per week. Focus on learning proper form with moderate intensity.',
      weeklySchedule: fillWeek(p1Days, cardioDay),
      progressionStrategy: 'Focus on form mastery. Add weight only when all sets hit the top of the rep range with good form.',
      deloadWeek: 4,
    },
    {
      phaseNumber: 2,
      weekStart: 5,
      weekEnd: 8,
      name: 'Volume Build',
      description: 'Increased sets and reduced RIR. Same full body structure with progressive overload.',
      weeklySchedule: fillWeek(p2Days, cardioDay),
      progressionStrategy: 'Aim to add 2.5kg (upper) or 5kg (lower) when hitting rep targets. Track every session.',
      deloadWeek: 8,
    },
    {
      phaseNumber: 3,
      weekStart: 9,
      weekEnd: 12,
      name: 'Upper/Lower Split',
      description: 'Transitioning to 4 days per week. Each muscle group trained 2x with more exercise variety.',
      weeklySchedule: fillWeek(p3Days, cardioDay),
      progressionStrategy: 'Linear progression on compounds. Double progression on isolation movements.',
      deloadWeek: 12,
    },
    {
      phaseNumber: 4,
      weekStart: 13,
      weekEnd: 16,
      name: 'Intensification',
      description: 'Higher volume upper/lower split with reduced RIR. Pushing closer to failure on key movements.',
      weeklySchedule: fillWeek(p4Days, cardioDay),
      progressionStrategy: 'Push compounds to RPE 8-9. Accessories to near failure. Prioritize progressive overload over volume.',
      deloadWeek: 16,
    },
  ]
}

function buildIntermediatePhases(a: AssessmentResponses, ctx: SelectionContext): GeneratedPhase[] {
  const daysPerWeek = a.availability.days_per_week
  const wantsFatLoss = a.goals.primary.toLowerCase().includes('fat loss')
  const cardioDay = wantsFatLoss ? buildCardioDay('saturday', a) : null

  if (daysPerWeek >= 5) {
    // PPL split
    const days = assignDays(a.availability.preferred_days, Math.min(daysPerWeek, 6))

    const p1Days: GeneratedDayPlan[] = [
      buildPushDay(days[0], a, ctx),
      buildPullDay(days[1], a, ctx),
      buildLegsPPL(days[2], a, ctx),
    ]
    if (days[3]) p1Days.push(buildPushDay(days[3], a, ctx))
    if (days[4]) p1Days.push(buildPullDay(days[4], a, ctx))
    if (days[5]) p1Days.push(buildLegsPPL(days[5], a, ctx))

    const p2Days = p1Days.map((d) => ({
      ...d,
      mainExercises: d.mainExercises.map((e) => ({ ...e, targetSets: e.targetSets + 1, targetRir: Math.max(e.targetRir - 1, 0) })),
    }))

    return [
      {
        phaseNumber: 1,
        weekStart: 1,
        weekEnd: 6,
        name: 'PPL Base',
        description: `Push/Pull/Legs split training ${days.length}x per week. Each muscle group hit ${days.length >= 6 ? '2x' : '~1.5x'} per week with balanced volume.`,
        weeklySchedule: fillWeek(p1Days, cardioDay),
        progressionStrategy: 'Linear progression on compounds (2.5kg upper / 5kg lower). Double progression on accessories.',
        deloadWeek: 6,
      },
      {
        phaseNumber: 2,
        weekStart: 7,
        weekEnd: 12,
        name: 'PPL Volume Block',
        description: 'Increased sets per exercise and reduced RIR. Pushing intensity while maintaining frequency.',
        weeklySchedule: fillWeek(p2Days, cardioDay),
        progressionStrategy: 'Prioritize progressive overload. If stalling, add a set before adding weight.',
        deloadWeek: 12,
      },
    ]
  }

  // Upper/Lower for 3-4 days
  const days = assignDays(a.availability.preferred_days, Math.min(daysPerWeek, 4))

  const p1Days: GeneratedDayPlan[] = [
    buildUpperDay('Upper A', days[0], 'A', a, ctx, 'moderate'),
    buildLowerDay('Lower A', days[1], 'A', a, ctx, 'moderate'),
  ]
  if (days[2]) p1Days.push(buildUpperDay('Upper B', days[2], 'B', a, ctx, 'moderate'))
  if (days[3]) p1Days.push(buildLowerDay('Lower B', days[3], 'B', a, ctx, 'moderate'))

  const p2Days: GeneratedDayPlan[] = [
    buildUpperDay('Upper A', days[0], 'A', a, ctx, 'high'),
    buildLowerDay('Lower A', days[1], 'A', a, ctx, 'high'),
  ]
  if (days[2]) p2Days.push(buildUpperDay('Upper B', days[2], 'B', a, ctx, 'high'))
  if (days[3]) p2Days.push(buildLowerDay('Lower B', days[3], 'B', a, ctx, 'high'))

  return [
    {
      phaseNumber: 1,
      weekStart: 1,
      weekEnd: 6,
      name: 'Upper/Lower Base',
      description: `Upper/Lower split training ${days.length}x per week. Balanced compound + isolation work.`,
      weeklySchedule: fillWeek(p1Days, cardioDay),
      progressionStrategy: 'Linear progression on compounds. Double progression on accessories. Add weight when hitting top of rep range for all sets.',
      deloadWeek: 6,
    },
    {
      phaseNumber: 2,
      weekStart: 7,
      weekEnd: 12,
      name: 'Intensification Block',
      description: 'Increased volume and intensity. Reduced RIR on compound movements.',
      weeklySchedule: fillWeek(p2Days, cardioDay),
      progressionStrategy: 'Push compounds toward RPE 8-9. Accessories to near failure. If stuck, reduce weight 10% and rebuild.',
      deloadWeek: 12,
    },
  ]
}

// ─── Overload rules ────────────────────────────────────────

function buildOverloadRules(beginner: boolean): PlanOverloadRules {
  return {
    linearProgression: beginner
      ? 'When hitting the top of the rep range for all sets at RPE 7 or below, increase weight by 2.5kg (upper body) or 5kg (lower body) next session.'
      : 'When hitting the top of the rep range for all sets at RPE 7-8, increase weight by 2.5kg (upper body) or 5kg (lower body). If only 1-2 sets hit the target, keep the weight and aim for more reps.',
    doubleProgression: 'First increase reps within the target range across all sets. Once all sets hit the top of the range, increase weight by the minimum increment and reset to the bottom of the rep range.',
    failureProtocol: 'If failing to hit the minimum reps for 2 consecutive sessions on a given exercise, reduce weight by 10% and rebuild. Check sleep, nutrition, and recovery before blaming the program.',
    deloadProtocol: beginner
      ? 'Every 4th week: same exercises, 60% of working weight, same reps. Focus purely on form and mind-muscle connection. No grinding reps.'
      : 'Every 6th week: same exercises, 60-70% of working weight, reduce sets by 1. Active recovery — maintain movement quality without accumulating fatigue.',
  }
}

// ─── Rationale builder ─────────────────────────────────────

function buildRationale(a: AssessmentResponses, beginner: boolean): string {
  const parts: string[] = []
  const goal = a.goals.primary
  const sex = a.basics.sex === 'female' ? 'her' : 'his'

  if (beginner) {
    parts.push(
      `This is a 16-week beginner program designed for someone with ${a.training.gym_months ?? 0} months of gym experience.`,
      `It starts with 3x/week full body to build movement patterns and base strength, then transitions to an upper/lower split at week 9 for increased volume and muscle stimulation.`,
    )
  } else {
    const split = a.availability.days_per_week >= 5 ? 'Push/Pull/Legs' : 'Upper/Lower'
    parts.push(
      `This is a 12-week intermediate program using a ${split} split, optimized for ${a.availability.days_per_week} training days per week.`,
    )
  }

  if (goal.toLowerCase().includes('fat loss')) {
    parts.push(
      `Since the primary goal is fat loss, cardio sessions are included on rest days and post-workout. The program preserves muscle mass through sufficient protein stimulus while supporting a caloric deficit.`,
    )
  } else if (goal.toLowerCase().includes('muscle')) {
    parts.push(
      `Since the primary goal is muscle gain, the program prioritizes progressive overload on compound lifts with sufficient volume (10-20 sets per muscle group per week) to drive hypertrophy.`,
    )
  } else if (goal.toLowerCase().includes('strength')) {
    parts.push(
      `Since the primary goal is strength, compound lifts use lower rep ranges (6-10) with higher rest periods and linear progression.`,
    )
  }

  if (a.preferences.injuries) {
    parts.push(`Exercise selection accounts for ${sex} reported concern: "${a.preferences.injuries}". Exercises that could aggravate this have been excluded or substituted with safer alternatives.`)
  }

  if (a.preferences.preference === 'machines') {
    parts.push('Machine-based exercises are prioritized per preference, while still including key free-weight compounds for balanced development.')
  }

  parts.push('Every training day includes a warm-up circuit, core finisher, and cooldown stretching. Deload weeks are built in to prevent overtraining.')

  return parts.join(' ')
}

// ─── Main generator ────────────────────────────────────────

export function generatePlan(assessment: AssessmentResponses): GeneratedWorkoutPlan {
  const beginner = isBeginner(assessment)
  const equipment = getAvailableEquipment(assessment)

  const ctx: SelectionContext = {
    usedIds: new Set<string>(),
    cannotDo: assessment.preferences.cannot_do,
    injuries: assessment.preferences.injuries,
    equipment,
    preference: assessment.preferences.preference,
  }

  const phases = beginner
    ? buildBeginnerPhases(assessment, ctx)
    : buildIntermediatePhases(assessment, ctx)

  const totalWeeks = phases[phases.length - 1].weekEnd

  const planName = beginner
    ? 'Beginner Full Body → Upper/Lower'
    : assessment.availability.days_per_week >= 5
      ? 'Intermediate Push/Pull/Legs'
      : 'Intermediate Upper/Lower'

  return {
    planName,
    totalWeeks,
    phases,
    overloadRules: buildOverloadRules(beginner),
    rationale: buildRationale(assessment, beginner),
  }
}
