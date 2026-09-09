import { useMemo } from 'react'
import type { GeneratedWorkoutPlan, GeneratedDayPlan, GeneratedPhase } from '../../../lib/types'

interface TodayWorkoutResult {
  dayPlan: GeneratedDayPlan | null
  phase: GeneratedPhase | null
  currentWeek: number
  isRestDay: boolean
  isDeloadWeek: boolean
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function useTodayWorkout(
  plan: GeneratedWorkoutPlan | null,
  startDate: string | null,
): TodayWorkoutResult {
  return useMemo(() => {
    if (!plan || !startDate) {
      return { dayPlan: null, phase: null, currentWeek: 0, isRestDay: true, isDeloadWeek: false }
    }

    const start = new Date(startDate)
    const today = new Date()
    start.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1)

    // Clamp to plan duration — loop back if plan is over
    const effectiveWeek = ((currentWeek - 1) % plan.totalWeeks) + 1

    const phase = plan.phases.find(
      (p) => effectiveWeek >= p.weekStart && effectiveWeek <= p.weekEnd,
    ) ?? plan.phases[plan.phases.length - 1]

    const isDeloadWeek = phase.deloadWeek === effectiveWeek

    const todayName = DAY_NAMES[today.getDay()]
    const dayPlan = phase.weeklySchedule.find(
      (d) => d.dayOfWeek.toLowerCase() === todayName.toLowerCase(),
    ) ?? null

    const isRestDay = !dayPlan || dayPlan.type === 'rest'

    return { dayPlan, phase, currentWeek: effectiveWeek, isRestDay, isDeloadWeek }
  }, [plan, startDate])
}
