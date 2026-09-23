import { useMemo } from 'react'
import type { PlanData, PlanDay } from '../planTypes'
import { orderedTrainingDays, planDayIndexForDate } from '../planProgress'

interface TodayWorkoutResult {
  dayPlan: PlanDay | null
  sessionIndex: number
  /** True on the user's non-training weekdays (weekday schedule active), or when
   *  there is no usable plan. Honest rest days — no session is shown. */
  isRestDay: boolean
  /** false = we fell back to elapsed-day cycling because preferred_days is
   *  empty/missing. The UI can hide rest-day framing in that mode. */
  usesWeekdaySchedule: boolean
  /** Training weekdays in canonical Mon→Sun order (for the day picker / UI). */
  trainingDays: string[]
}

/**
 * Maps the plan's weekly microcycle (plan.days[]) onto the user's real training
 * weekdays (assessment.availability.preferred_days) so "today" is honest:
 *   - a training weekday shows that weekday's session (stable week-to-week),
 *   - any other weekday is a genuine Rest Day.
 * The mapping is delegated to planProgress.planDayIndexForDate (pure + tested).
 *
 * FALLBACK: if preferred_days is empty/missing we keep the legacy behavior —
 * cycle one session per elapsed calendar day since start_date, never resting —
 * so nothing crashes for a profile without preferred_days set.
 */
export function useTodayWorkout(
  plan: PlanData | null,
  startDate: string | null,
  preferredDays: string[] | null | undefined,
): TodayWorkoutResult {
  return useMemo(() => {
    // plan.days is absent on legacy phases-based plan_data — treat as no session.
    if (!plan || !plan.days?.length) {
      return { dayPlan: null, sessionIndex: 0, isRestDay: true, usesWeekdaySchedule: false, trainingDays: [] }
    }

    const training = orderedTrainingDays(preferredDays)

    // ── Weekday schedule (the real behavior) ──
    if (training.length > 0) {
      const idx = planDayIndexForDate(new Date(), preferredDays, plan.days.length)
      if (idx === null) {
        return { dayPlan: null, sessionIndex: 0, isRestDay: true, usesWeekdaySchedule: true, trainingDays: training }
      }
      return { dayPlan: plan.days[idx], sessionIndex: idx, isRestDay: false, usesWeekdaySchedule: true, trainingDays: training }
    }

    // ── Fallback: legacy elapsed-day cycling (no preferred_days) ──
    if (!startDate) {
      return { dayPlan: null, sessionIndex: 0, isRestDay: true, usesWeekdaySchedule: false, trainingDays: [] }
    }
    const start = new Date(startDate)
    const today = new Date()
    start.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000))
    const sessionIndex = diffDays % plan.days.length
    return { dayPlan: plan.days[sessionIndex], sessionIndex, isRestDay: false, usesWeekdaySchedule: false, trainingDays: [] }
  }, [plan, startDate, preferredDays])
}
