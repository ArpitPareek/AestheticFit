import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useProfile } from '../profile/ProfileContext'
import { useLocalToday } from '../../hooks/useLocalToday'
import {
  getRoutineForProfile,
  getAmStepsForDay,
  getDayOfWeek,
} from '../../lib/constants/skincare'
import type { Tables } from '../../types/supabase'

type SkinLogChecklist = Pick<Tables<'skin_logs'>, 'routine_type' | 'steps_done'>

interface DashboardSnapshot {
  latestWeight: number | null
  lastSleep: number | null
  todaySteps: number | null
  todayWater: number | null
  amSkinDone: boolean
  pmSkinDone: boolean
  workoutDoneToday: boolean
}

export function useDashboardData() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [data, setData] = useState<DashboardSnapshot>({
    latestWeight: null,
    lastSleep: null,
    todaySteps: null,
    todayWater: null,
    amSkinDone: false,
    pmSkinDone: false,
    workoutDoneToday: false,
  })
  const [loading, setLoading] = useState(true)

  const today = useLocalToday()

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [weightRes, dailyRes, skinRes, workoutRes] = await Promise.all([
      supabase
        .from('weight_logs')
        .select('weight_kg')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('daily_logs')
        .select('steps, sleep_hours, water_glasses')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle(),
      supabase
        .from('skin_logs')
        .select('routine_type, steps_done')
        .eq('user_id', user.id)
        .eq('log_date', today),
      supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('workout_date', today),
    ])

    const skinLogs = skinRes.data ?? []
    const amLog = skinLogs.find((s) => s.routine_type === 'am')
    const pmLog = skinLogs.find((s) => s.routine_type === 'pm')

    const routine = getRoutineForProfile(profile?.sex ?? null)
    const today_dow = getDayOfWeek()
    const amExpectedIds = getAmStepsForDay(routine, today_dow).map((s) => s.id)
    const pmExpectedIds = routine.pmRoutines[today_dow].steps.map((s) => s.id)

    const allDone = (log: SkinLogChecklist | undefined, expected: string[]) => {
      if (!log || expected.length === 0) return false
      const steps = log.steps_done as unknown as Record<string, boolean>
      return expected.every((id) => steps[id] === true)
    }

    setData({
      latestWeight: weightRes.data?.weight_kg ?? null,
      lastSleep: dailyRes.data?.sleep_hours ?? null,
      todaySteps: dailyRes.data?.steps ?? null,
      todayWater: dailyRes.data?.water_glasses ?? null,
      amSkinDone: allDone(amLog, amExpectedIds),
      pmSkinDone: allDone(pmLog, pmExpectedIds),
      workoutDoneToday: (workoutRes.count ?? 0) > 0,
    })
    setLoading(false)
  }, [user, today, profile?.sex])

  useEffect(() => { load() }, [load])

  return { ...data, loading, reload: load }
}
