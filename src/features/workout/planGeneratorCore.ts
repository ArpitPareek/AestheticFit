// Pure, deterministic plan generator core — NO imports of the Supabase client
// and NO network/LLM calls anywhere in this module. Given an assessment, a
// goal mode, a phase number, and an already-fetched exercise_library snapshot,
// it produces plan_data. This is what makes "runs client-side and offline" a
// structural guarantee rather than just a comment: this module physically
// cannot make a network call. The IO wrapper (planGenerator.ts) fetches the
// inputs from Supabase and calls this.

import type { AssessmentResponses } from '../profile/types'
import { injuryTextToTags } from './injuryTags'
import { fillSlot, type SelectorContext } from './exerciseSelector'
import { getPhaseTemplates } from './planTemplates'
import type {
  DayTemplate,
  GoalMode,
  LibraryExercise,
  PlanData,
  PlanDay,
  PlanSlotExercise,
} from './planTypes'

// ─── Equipment mapping: assessment strings -> exercise_library equipment tags ─
const EQUIPMENT_MAPPING: Record<string, string[]> = {
  'Full Commercial Gym': ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'band', 'pull_up_bar', 'bench'],
  Dumbbells: ['dumbbell', 'bench'],
  Barbells: ['barbell', 'bench'],
  Cables: ['cable'],
  'Smith Machine': ['machine'],
  Machines: ['machine'],
  'Pull-up Bar': ['pull_up_bar'],
  Bench: ['dumbbell', 'barbell', 'bench'],
  'Cardio Machines': ['treadmill', 'stationary_bike', 'elliptical'],
  'Resistance Bands': ['band'],
  'Swimming Pool': ['none'],
  'Badminton Court': ['none'],
}

function getAvailableEquipment(assessment: AssessmentResponses): Set<string> {
  const set = new Set<string>(['bodyweight', 'none'])
  for (const item of assessment.equipment) {
    const mapped = EQUIPMENT_MAPPING[item]
    if (mapped) mapped.forEach((e) => set.add(e))
  }
  return set
}

/**
 * Fills one day template against the library, capping at 6-7 slots (the
 * template authoring already respects this; this is a defensive cap in case
 * a future template grows too large for the 60-min session budget).
 */
function fillDay(day: DayTemplate, baseCtx: Omit<SelectorContext, 'usedInDay'>): PlanDay {
  const usedInDay = new Set<string>()
  const exercises: PlanSlotExercise[] = []

  for (const slot of day.slots.slice(0, 7)) {
    const result = fillSlot(slot, { ...baseCtx, usedInDay })
    if (!result) continue // no eligible exercise for this slot (e.g. equipment/injury filtered everything out)

    usedInDay.add(result.ref.id)
    exercises.push({
      ref: result.ref,
      sets: slot.sets,
      rep_low: slot.repLow,
      rep_high: slot.repHigh,
      rir: slot.rir,
      rest_s: slot.restSeconds,
      progression: slot.progression,
      alternatives: result.alternatives,
      note: slot.note,
    })
  }

  return { label: day.label, split: day.split, exercises }
}

export function generatePhasePlanData(
  assessment: AssessmentResponses,
  goalMode: GoalMode,
  phaseNumber: number,
  library: LibraryExercise[],
): PlanData {
  const templates = getPhaseTemplates(goalMode)
  const template = templates.find((t) => t.phaseNumber === phaseNumber)
  if (!template) {
    throw new Error(`No phase template for phase ${phaseNumber} (goal_mode=${goalMode})`)
  }

  const baseCtx: Omit<SelectorContext, 'usedInDay'> = {
    library,
    availableEquipment: getAvailableEquipment(assessment),
    injuryTags: injuryTextToTags(assessment.preferences.injuries),
    cannotDo: assessment.preferences.cannot_do,
    preference: assessment.preferences.preference,
  }

  // A phase template defines a SET of day-templates, not a fixed weekly count.
  // Schedule days_per_week sessions by cycling through them in order — never
  // emit fewer days than the user actually trains.
  const sessionCount =
    assessment.availability.days_per_week && assessment.availability.days_per_week > 0
      ? assessment.availability.days_per_week
      : template.days.length

  const days = Array.from({ length: sessionCount }, (_, i) => template.days[i % template.days.length]).map((day) =>
    fillDay(day, baseCtx),
  )

  return {
    version: 1, // overwritten by the IO layer with the actual workout_plans row version
    phase: phaseNumber,
    total_phases: templates.length,
    days,
  }
}
