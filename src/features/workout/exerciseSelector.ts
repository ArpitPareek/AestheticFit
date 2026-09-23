import type { ContraindicationTag } from './injuryTags'
import type { ExerciseRef, LibraryExercise, LogicalMuscleTarget, SlotSpec } from './planTypes'

export interface SelectorContext {
  library: LibraryExercise[]
  availableEquipment: Set<string>
  injuryTags: ContraindicationTag[]
  cannotDo: string[]
  preference: 'machines' | 'free-weights' | 'bodyweight' | 'mixed'
  /** exercise ids already used earlier in the SAME day (avoid duplicate slot fills) */
  usedInDay: Set<string>
}

// Bridges the two muscle taxonomies in the library (broad: chest/back/shoulders/...
// vs granular: upper_chest/side_delt/front_delt/rear_delt/lats introduced in
// migration 017). Only a handful of rows carry the granular tag today, so most
// matching still falls back to id/name keyword disambiguation on the broad tag.
function matchesTarget(ex: LibraryExercise, target: LogicalMuscleTarget): boolean {
  const id = ex.id.toLowerCase()
  switch (target) {
    case 'upper_chest':
      return ex.primary_muscle === 'upper_chest' || (ex.primary_muscle === 'chest' && /incline/.test(id))
    case 'chest':
      return ex.primary_muscle === 'chest' || ex.primary_muscle === 'upper_chest'
    case 'lats':
      return ex.primary_muscle === 'lats' || (ex.primary_muscle === 'back' && /pulldown|pull-up|pullup/.test(id))
    case 'back':
      return ex.primary_muscle === 'back' || ex.primary_muscle === 'lats'
    case 'side_delt':
      return ex.primary_muscle === 'side_delt' || (ex.primary_muscle === 'shoulders' && /lateral/.test(id))
    case 'front_delt':
      return (
        ex.primary_muscle === 'front_delt' ||
        (ex.primary_muscle === 'shoulders' && /overhead-press|shoulder-press|_ohp/.test(id))
      )
    case 'rear_delt':
      return (
        ex.primary_muscle === 'rear_delt' ||
        (ex.primary_muscle === 'shoulders' && /reverse-fly|face-pull/.test(id))
      )
    case 'quads':
      return ex.primary_muscle === 'quads'
    case 'hamstrings':
      return ex.primary_muscle === 'hamstrings'
    case 'glutes':
      return ex.primary_muscle === 'glutes'
    case 'biceps':
      return ex.primary_muscle === 'biceps'
    case 'triceps':
      return ex.primary_muscle === 'triceps'
    case 'core':
      return ex.primary_muscle === 'core'
    case 'cardio':
      return ex.primary_muscle === 'cardio'
    case 'calves':
      return ex.primary_muscle === 'calves'
    default:
      return false
  }
}

// Broader muscle "family" used ONLY to backfill alternatives when the strict
// movement_pattern+target match doesn't have enough candidates (e.g. the
// library only has one isolation quad exercise). The PRIMARY pick always
// comes from the strict match; this never changes what gets chosen, only
// what gets offered as a swap.
function matchesFamily(ex: LibraryExercise, target: LogicalMuscleTarget): boolean {
  switch (target) {
    case 'upper_chest':
    case 'chest':
      return ex.primary_muscle === 'chest' || ex.primary_muscle === 'upper_chest'
    case 'lats':
    case 'back':
      return ex.primary_muscle === 'back' || ex.primary_muscle === 'lats'
    case 'side_delt':
    case 'front_delt':
    case 'rear_delt':
      return ['shoulders', 'side_delt', 'front_delt', 'rear_delt'].includes(ex.primary_muscle)
    case 'quads':
      return ex.primary_muscle === 'quads'
    case 'hamstrings':
      return ex.primary_muscle === 'hamstrings'
    case 'glutes':
      return ex.primary_muscle === 'glutes'
    case 'biceps':
      return ex.primary_muscle === 'biceps'
    case 'triceps':
      return ex.primary_muscle === 'triceps'
    case 'core':
      return ex.primary_muscle === 'core'
    case 'cardio':
      return ex.primary_muscle === 'cardio'
    case 'calves':
      return ex.primary_muscle === 'calves'
    default:
      return false
  }
}

function hasEquipment(ex: LibraryExercise, available: Set<string>): boolean {
  if (ex.equipment.length === 0) return true
  return ex.equipment.some((e) => available.has(e))
}

function isCannotDo(ex: LibraryExercise, cannotDo: string[]): boolean {
  const lower = cannotDo.map((c) => c.toLowerCase())
  return lower.some((c) => ex.name.toLowerCase().includes(c) || ex.id.toLowerCase().includes(c))
}

function violatesInjuryTags(ex: LibraryExercise, injuryTags: ContraindicationTag[]): boolean {
  if (injuryTags.length === 0) return false
  return ex.contraindications.some((tag) => injuryTags.includes(tag as ContraindicationTag))
}

function preferenceScore(ex: LibraryExercise, preference: SelectorContext['preference']): number {
  let score = (ex.sfr_rating ?? 3) * 2
  if (preference === 'machines' && ex.equipment.includes('machine')) score += 3
  if (preference === 'machines' && ex.equipment.includes('cable')) score += 2
  if (preference === 'free-weights' && (ex.equipment.includes('barbell') || ex.equipment.includes('dumbbell'))) score += 3
  if (preference === 'bodyweight' && ex.equipment.includes('bodyweight')) score += 4
  // lower stability demand ranks slightly higher for foundation-phase safety bias
  if (ex.stability_demand === 'low') score += 1
  return score
}

// Deterministic ranking: score desc, then id ascending. The id tiebreak means
// re-seeding/reordering the library can never silently change a generated
// plan — ties always resolve the same way.
function rank(candidates: LibraryExercise[], preference: SelectorContext['preference']): LibraryExercise[] {
  return [...candidates].sort((a, b) => {
    const scoreDiff = preferenceScore(b, preference) - preferenceScore(a, preference)
    if (scoreDiff !== 0) return scoreDiff
    return a.id.localeCompare(b.id)
  })
}

// Base eligibility (deprecated/equipment/cannot-do/injury) applies to both the
// primary pick and every alternative. usedInDay is deliberately NOT part of
// this — it only constrains what the PLAN assigns as a primary exercise
// twice in one session; it must not starve the swap-alternatives list when
// the library only has a couple of exercises for a given muscle.
function eligibleBase(ex: LibraryExercise, ctx: SelectorContext): boolean {
  if (ex.deprecated) return false // inadvisable for everyone, independent of per-user injury tags
  if (!hasEquipment(ex, ctx.availableEquipment)) return false
  if (isCannotDo(ex, ctx.cannotDo)) return false
  if (violatesInjuryTags(ex, ctx.injuryTags)) return false
  return true
}

export interface SlotFillResult {
  ref: ExerciseRef
  alternatives: ExerciseRef[]
}

/**
 * Fills one slot: matches movement_pattern + target muscle, filters out
 * deprecated/contraindicated/unequipped/excluded exercises, ranks the
 * remainder, and returns the top pick plus its next 2-3 runners-up as swap
 * alternatives. If the strict movement_pattern+target pool is too small to
 * supply 2-3 alternatives (a real library gap, not a filtering artifact),
 * backfills from the broader muscle family so the swap flow always has
 * options — this never changes the PRIMARY pick, only what's offered as a
 * substitute.
 */
export function fillSlot(spec: SlotSpec, ctx: SelectorContext): SlotFillResult | null {
  const strictMatch = (ex: LibraryExercise) =>
    matchesTarget(ex, spec.target) && spec.movementPatterns.includes(ex.movement_pattern) && eligibleBase(ex, ctx)

  // Primary pick must not repeat an exercise already assigned elsewhere THIS
  // day.
  const primaryPool = rank(
    ctx.library.filter((ex) => strictMatch(ex) && !ctx.usedInDay.has(ex.id)),
    ctx.preference,
  )
  if (primaryPool.length === 0) return null
  const chosen = primaryPool[0]

  // Alternatives are a menu of valid substitutes for THIS slot — usedInDay
  // doesn't apply here, only "not the chosen exercise itself".
  const seen = new Set<string>([chosen.id])
  const alternatives: LibraryExercise[] = []

  const strictAltPool = rank(
    ctx.library.filter((ex) => strictMatch(ex) && !seen.has(ex.id)),
    ctx.preference,
  )
  for (const ex of strictAltPool) {
    if (alternatives.length >= 3) break
    alternatives.push(ex)
    seen.add(ex.id)
  }

  if (alternatives.length < 3) {
    const familyBackfill = rank(
      ctx.library.filter((ex) => matchesFamily(ex, spec.target) && eligibleBase(ex, ctx) && !seen.has(ex.id)),
      ctx.preference,
    )
    for (const ex of familyBackfill) {
      if (alternatives.length >= 3) break
      alternatives.push(ex)
      seen.add(ex.id)
    }
  }

  return {
    ref: { type: 'library', id: chosen.id },
    alternatives: alternatives.map((ex) => ({ type: 'library', id: ex.id })),
  }
}
