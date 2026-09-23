import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import { useProfile } from '../../profile/ProfileContext'
import { detectRecovery, type RecoveryExerciseSession, type RecoveryResult } from '../recoveryDetection'
import type { ExerciseSet } from '../../../lib/types'
import type { GoalMode } from '../../workout/planTypes'

const DAY_MS = 86_400_000
const WINDOW_DAYS = 21
const PRIOR_TARGET_DAYS = 14 // "~2 weeks ago" comparison point for body signals

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Fetches everything the READ-ONLY recovery advisory needs — recent
 * exercise_logs (+workout_date), the 28-day weight trend, waist tape, and
 * sleep — then runs the pure detector. Fetches only; it never writes.
 */
export function useRecoveryWatch() {
  const { user } = useAuth()
  const { activePlan, loading: profileLoading } = useProfile()
  const [result, setResult] = useState<RecoveryResult | null>(null)
  const [loading, setLoading] = useState(true)

  const plan = activePlan?.plan_data ?? null

  useEffect(() => {
    if (!user || profileLoading) return
    let cancelled = false
    setLoading(true)

    Promise.all([
      // nutrition_config.goal_mode — decides which rule/message applies.
      supabase.from('nutrition_config').select('goal_mode').eq('user_id', user.id).maybeSingle(),
      // Recent exercise logs joined to their workout_date.
      supabase
        .from('exercise_logs')
        .select('library_exercise_id, exercise_id, exercise_name, sets, workout_logs!inner(workout_date, user_id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      // 28-day moving average over the window (latest + a ~2-week-prior sample).
      supabase
        .from('weight_trend')
        .select('log_date, ma_28d')
        .eq('user_id', user.id)
        .gte('log_date', isoDaysAgo(WINDOW_DAYS + PRIOR_TARGET_DAYS))
        .order('log_date', { ascending: false }),
      // Waist tape over the window.
      supabase
        .from('weight_logs')
        .select('log_date, waist_cm')
        .eq('user_id', user.id)
        .gte('log_date', isoDaysAgo(WINDOW_DAYS + PRIOR_TARGET_DAYS))
        .order('log_date', { ascending: false }),
      // Sleep over the last 2 weeks.
      supabase
        .from('daily_logs')
        .select('log_date, sleep_hours')
        .eq('user_id', user.id)
        .gte('log_date', isoDaysAgo(PRIOR_TARGET_DAYS)),
    ]).then(([configRes, logsRes, trendRes, waistRes, sleepRes]) => {
      if (cancelled) return

      const goalMode = (configRes.data?.goal_mode as GoalMode) ?? 'maintain'

      const sessions: RecoveryExerciseSession[] = (logsRes.data ?? []).map((r) => {
        const wl = r.workout_logs as unknown as { workout_date: string }
        const rawSets = (r.sets as unknown as ExerciseSet[]) ?? []
        return {
          libraryId: (r.library_exercise_id as string | null) ?? null,
          exerciseId: r.exercise_id as string,
          name: (r.exercise_name as string) ?? (r.exercise_id as string),
          date: wl.workout_date,
          sets: rawSets.map((s) => ({ weight_kg: s.weight_kg, reps: s.reps, rir: s.rir })),
        }
      })

      // Trend rows come newest-first. Latest = [0]; prior = the newest row on or
      // before ~2 weeks ago (closest cycle-matched comparison we have).
      const trend = (trendRes.data ?? []) as { log_date: string; ma_28d: number | null }[]
      const priorCutoff = isoDaysAgo(PRIOR_TARGET_DAYS)
      const latestTrend = trend[0] ?? null
      const priorTrend = trend.find((t) => t.log_date <= priorCutoff) ?? null

      const waistRows = ((waistRes.data ?? []) as { log_date: string; waist_cm: number | null }[]).filter(
        (w) => w.waist_cm != null,
      )
      const latestWaist = waistRows[0] ?? null
      const priorWaist = waistRows.find((w) => w.log_date <= priorCutoff) ?? null

      const sleepVals = ((sleepRes.data ?? []) as { sleep_hours: number | null }[])
        .map((d) => d.sleep_hours)
        .filter((v): v is number => v != null)
      const sleepAvg = sleepVals.length ? sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length : null

      const res = detectRecovery({
        goalMode,
        plan,
        sessions,
        body: {
          ma28dLatest: latestTrend?.ma_28d ?? null,
          ma28dLatestDate: latestTrend?.log_date ?? null,
          ma28dPrior: priorTrend?.ma_28d ?? null,
          ma28dPriorDate: priorTrend?.log_date ?? null,
          waistRecent: latestWaist?.waist_cm ?? null,
          waistPrior: priorWaist?.waist_cm ?? null,
        },
        sleepAvg,
        nowMs: Date.now(),
      })

      setResult(res)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user, profileLoading, plan])

  return { result, loading }
}
