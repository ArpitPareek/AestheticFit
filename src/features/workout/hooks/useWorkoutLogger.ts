import { useCallback, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import type { ExerciseSet } from '../../../lib/types'

interface LoggedExercise {
  exerciseId: string
  exerciseName: string
  sets: ExerciseSet[]
}

interface WorkoutLoggerState {
  workoutLogId: string | null
  startedAt: Date | null
  loggedExercises: Record<string, ExerciseSet[]>
  saving: boolean
  finished: boolean
}

export function useWorkoutLogger(planId: string | null, dayLabel: string) {
  const { user } = useAuth()
  const [state, setState] = useState<WorkoutLoggerState>({
    workoutLogId: null,
    startedAt: null,
    loggedExercises: {},
    saving: false,
    finished: false,
  })
  const workoutLogIdRef = useRef<string | null>(null)

  const ensureWorkoutLog = useCallback(async (): Promise<string | null> => {
    if (workoutLogIdRef.current) return workoutLogIdRef.current
    if (!user || !planId) return null

    const today = new Date().toISOString().split('T')[0]
    // Check for existing log today
    const { data: existing } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_date', today)
      .maybeSingle()

    if (existing) {
      workoutLogIdRef.current = existing.id
      setState((s) => ({ ...s, workoutLogId: existing.id, startedAt: new Date() }))
      return existing.id
    }

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        plan_id: planId,
        plan_version: 1,
        workout_date: today,
        day_label: dayLabel,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) return null
    workoutLogIdRef.current = data.id
    setState((s) => ({ ...s, workoutLogId: data.id, startedAt: new Date() }))
    return data.id
  }, [user, planId, dayLabel])

  const logSet = useCallback(
    async (exerciseId: string, exerciseName: string, set: ExerciseSet, orderIndex: number) => {
      setState((s) => ({ ...s, saving: true }))

      const logId = await ensureWorkoutLog()
      if (!logId || !user) {
        setState((s) => ({ ...s, saving: false }))
        return
      }

      const currentSets = state.loggedExercises[exerciseId] ?? []
      const updatedSets = [...currentSets, set]

      // Upsert exercise_log — one row per exercise per workout
      const { data: existingLog } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('workout_log_id', logId)
        .eq('exercise_id', exerciseId)
        .maybeSingle()

      if (existingLog) {
        await supabase
          .from('exercise_logs')
          .update({ sets: updatedSets })
          .eq('id', existingLog.id)
      } else {
        await supabase.from('exercise_logs').insert({
          user_id: user.id,
          workout_log_id: logId,
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          order_index: orderIndex,
          sets: updatedSets,
        })
      }

      setState((s) => ({
        ...s,
        saving: false,
        loggedExercises: { ...s.loggedExercises, [exerciseId]: updatedSets },
      }))
    },
    [user, ensureWorkoutLog, state.loggedExercises],
  )

  const finishWorkout = useCallback(async (): Promise<{
    duration: number
    totalVolume: number
    exerciseCount: number
  } | null> => {
    const logId = workoutLogIdRef.current
    if (!logId) return null

    setState((s) => ({ ...s, saving: true }))

    await supabase
      .from('workout_logs')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', logId)

    const duration = state.startedAt
      ? Math.round((Date.now() - state.startedAt.getTime()) / 60000)
      : 0

    let totalVolume = 0
    let exerciseCount = 0
    for (const sets of Object.values(state.loggedExercises)) {
      if (sets.length > 0) exerciseCount++
      for (const s of sets) {
        totalVolume += s.weight_kg * s.reps
      }
    }

    setState((s) => ({ ...s, saving: false, finished: true }))
    return { duration, totalVolume, exerciseCount }
  }, [state.startedAt, state.loggedExercises])

  return {
    ...state,
    logSet,
    finishWorkout,
  }
}
