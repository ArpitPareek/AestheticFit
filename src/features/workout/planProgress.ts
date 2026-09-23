// Small, dependency-free helpers for "where in the plan am I" legibility.
// Kept pure so both the Workouts header and the Dashboard can share one source
// of truth for the week number (no drift between screens).

const MS_PER_WEEK = 604800000 // 7 * 24 * 60 * 60 * 1000

// ─── Weekday → plan-day scheduling ──────────────────────────────────────────
// The plan is a weekly MICROCYCLE: plan.days[] are ordered training sessions,
// not calendar-bound. We pin them to the user's real training weekdays
// (assessment.availability.preferred_days) so "today" is honest and rest days
// are genuinely rest days. Crucially the mapping is weekday-based, so it is
// STABLE week-to-week — Monday is always the same session — and nothing
// "drifts" one slot forward after each rest day the way elapsed-day cycling did.

// JS Date.getDay(): 0 = Sunday … 6 = Saturday.
const WEEKDAY_BY_INDEX = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const
// preferred_days stores full weekday names (see profile/types.ts DAYS_OF_WEEK).
const CANONICAL_WEEK_ORDER = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const

/** Weekday name for a Date, in the same vocabulary as preferred_days. */
export function weekdayName(date: Date): string {
  return WEEKDAY_BY_INDEX[date.getDay()]
}

/**
 * preferred_days filtered to valid weekday names and sorted Monday→Sunday,
 * de-duplicated. This canonical order is what we zip onto plan.days[], so the
 * schedule is deterministic no matter what order the user tapped days in the
 * assessment form.
 */
export function orderedTrainingDays(preferredDays: string[] | null | undefined): string[] {
  if (!preferredDays?.length) return []
  return CANONICAL_WEEK_ORDER.filter((d) => preferredDays.includes(d))
}

/**
 * Plan-day index for a given calendar date, or null if that date is a REST day.
 * Returns null when there are no valid training days (the caller then falls back
 * to elapsed-day cycling). If preferred_days has MORE entries than the plan has
 * sessions, sessions cycle (pos % planDayCount) — a safe fallback for a
 * mismatched length rather than crashing or dropping a training day.
 */
export function planDayIndexForDate(
  date: Date,
  preferredDays: string[] | null | undefined,
  planDayCount: number,
): number | null {
  if (planDayCount <= 0) return null
  const training = orderedTrainingDays(preferredDays)
  if (training.length === 0) return null
  const pos = training.indexOf(weekdayName(date))
  if (pos === -1) return null
  return pos % planDayCount
}

/**
 * 1-based week number since the phase's start_date, clamped to [1, phaseWeeks].
 * Before start_date (e.g. a plan that begins tomorrow) it reads Week 1, never 0
 * or negative. If phaseWeeks is unknown it just returns the uncapped week.
 */
export function weekWithinPhase(startDate: string | null | undefined, phaseWeeks?: number | null): number {
  if (!startDate) return 1
  const start = new Date(startDate)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const week = Math.floor((now.getTime() - start.getTime()) / MS_PER_WEEK) + 1
  const clamped = Math.max(1, week)
  return phaseWeeks && phaseWeeks > 0 ? Math.min(clamped, phaseWeeks) : clamped
}

// ─── Coach phase advancement (detection only — never mutates anything) ───────
export interface CoachPhaseStatus {
  isCoach: boolean
  /** today >= start_date + phase_weeks*7 (the authored block has fully elapsed) */
  phaseEnded: boolean
  /** phaseEnded AND there is a next authored phase to move to */
  canAdvance: boolean
  /** phaseEnded AND already on the last phase (program done — hold/coast) */
  isComplete: boolean
  nextPhase: number | null
}

interface PhasePlanLike {
  plan_source?: string
  phase: number
  total_phases: number
  phase_weeks?: number | null
  start_date: string | null
}

function phaseHasElapsed(startDate: string | null, phaseWeeks?: number | null): boolean {
  if (!startDate || !phaseWeeks || phaseWeeks <= 0) return false
  const start = new Date(startDate)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000)
  return days >= phaseWeeks * 7
}

/** Pure: given the active plan, decide whether to show an advance/complete banner. */
export function coachPhaseStatus(plan: PhasePlanLike | null | undefined): CoachPhaseStatus {
  const none: CoachPhaseStatus = { isCoach: false, phaseEnded: false, canAdvance: false, isComplete: false, nextPhase: null }
  if (!plan || plan.plan_source !== 'coach_authored') return none
  const ended = phaseHasElapsed(plan.start_date, plan.phase_weeks)
  const canAdvance = ended && plan.phase < plan.total_phases
  return {
    isCoach: true,
    phaseEnded: ended,
    canAdvance,
    isComplete: ended && plan.phase >= plan.total_phases,
    nextPhase: canAdvance ? plan.phase + 1 : null,
  }
}
