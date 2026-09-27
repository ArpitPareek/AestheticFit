import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import { localTodayISO } from '../../../lib/utils'
import type { ExerciseSet } from '../../../lib/types'

export interface ExerciseHistory {
  exercise_id: string
  workout_date: string
  sets: ExerciseSet[]
}

export function useExerciseHistory(exerciseIds: string[]) {
  const { user } = useAuth()
  const [history, setHistory] = useState<Record<string, ExerciseHistory>>({})
  const [loading, setLoading] = useState(false)

  const idsKey = exerciseIds.sort().join(',')

  const load = useCallback(async () => {
    if (!user || exerciseIds.length === 0) return
    setLoading(true)

    // Get the most recent log for each exercise. Exclude today's sets — the
    // in-session recommendation must be based on the LAST session, not the one
    // being logged right now. Otherwise saving a top-of-range set and re-opening
    // the card would say "add load" against a set that just happened (B15).
    const today = localTodayISO()
    const { data } = await supabase
      .from('exercise_logs')
      .select('exercise_id, sets, workout_logs!inner(workout_date)')
      .eq('user_id', user.id)
      .in('exercise_id', exerciseIds)
      .lt('workout_logs.workout_date', today)
      .order('workout_logs(workout_date)', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) {
      const latest: Record<string, ExerciseHistory> = {}
      for (const row of data) {
        if (latest[row.exercise_id]) continue
        const workoutLog = row.workout_logs as unknown as { workout_date: string }
        latest[row.exercise_id] = {
          exercise_id: row.exercise_id,
          workout_date: workoutLog.workout_date,
          sets: row.sets as unknown as ExerciseSet[],
        }
      }
      setHistory(latest)
    }
    setLoading(false)
  }, [user, idsKey])

  useEffect(() => {
    load()
  }, [load])

  return { history, loading, reload: load }
}
