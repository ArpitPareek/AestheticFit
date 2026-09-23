import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import type { ExerciseSet } from '../../../lib/types'


interface WorkoutLoggerState {
  workoutLogId: string | null
  startedAt: Date | null
  loggedExercises: Record<string, ExerciseSet[]>
  /** Maps original plan ref.id → swapped-to exercise_id for today's log. */
  swapMap: Record<string, string>
  saving: boolean
  finished: boolean
}

// Local-timezone calendar date (yyyy-mm-dd). NOT toISOString() — that is UTC and
// would roll the date backward for late-evening logging in +offset timezones
// (e.g. IST), writing a workout to the wrong day.
function localTodayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * @param workoutDate  Explicit calendar date (yyyy-mm-dd) this session logs
 *   against. Defaults to today. The day picker passes a past date so a missed /
 *   rearranged session is logged on the RIGHT date — the DB hydrate-on-mount and
 *   every write key off this date, and switching it re-hydrates that day's log.
 */
export function useWorkoutLogger(planId: string | null, dayLabel: string, workoutDate: string = localTodayISO()) {
  const { user } = useAuth()
  const [state, setState] = useState<WorkoutLoggerState>({
    workoutLogId: null,
    startedAt: null,
    loggedExercises: {},
    swapMap: {},
    saving: false,
    finished: false,
  })
  const workoutLogIdRef = useRef<string | null>(null)

  // Hydrate the selected date's already-logged sets from the DB, so leaving and
  // re-opening the Workouts tab (or reloading, or switching the logged date)
  // shows what was logged instead of an empty card. Without this, loggedExercises
  // lives only in memory — a real trust bug for someone training unsupervised.
  useEffect(() => {
    if (!user || !planId) return
    let cancelled = false
    // Switching dates: clear the prior date's in-memory log first so we never
    // show one day's sets while logging against another.
    workoutLogIdRef.current = null
    setState((s) => ({ ...s, workoutLogId: null, startedAt: null, loggedExercises: {}, swapMap: {}, finished: false }))
    ;(async () => {
      const { data: log } = await supabase
        .from('workout_logs')
        .select('id, started_at')
        .eq('user_id', user.id)
        .eq('workout_date', workoutDate)
        .maybeSingle()
      if (cancelled || !log) return
      workoutLogIdRef.current = log.id
      const { data: exLogs } = await supabase
        .from('exercise_logs')
        .select('exercise_id, sets, swapped_from_ref')
        .eq('workout_log_id', log.id)
      if (cancelled) return
      const logged: Record<string, ExerciseSet[]> = {}
      const swaps: Record<string, string> = {}
      for (const row of exLogs ?? []) {
        logged[row.exercise_id as string] = (row.sets as ExerciseSet[]) ?? []
        if (row.swapped_from_ref) swaps[row.swapped_from_ref as string] = row.exercise_id as string
      }
      setState((s) => ({
        ...s,
        workoutLogId: log.id,
        startedAt: log.started_at ? new Date(log.started_at as string) : s.startedAt,
        loggedExercises: logged,
        swapMap: swaps,
      }))
    })()
    return () => {
      cancelled = true
    }
  }, [user, planId, workoutDate])

  const ensureWorkoutLog = useCallback(async (): Promise<string | null> => {
    if (workoutLogIdRef.current) return workoutLogIdRef.current
    if (!user || !planId) return null

    // Check for an existing log on the selected date
    const { data: existing } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_date', workoutDate)
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
        workout_date: workoutDate,
        day_label: dayLabel,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) return null
    workoutLogIdRef.current = data.id
    setState((s) => ({ ...s, workoutLogId: data.id, startedAt: new Date() }))
    return data.id
  }, [user, planId, dayLabel, workoutDate])

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

  // Upserts the FULL set array for an exercise (replace, not append) — the rich
  // session card owns the working rows and saves them as a unit, so re-saving is
  // idempotent. Records the stable library_exercise_id (progress engine keys off
  // it) and, on a swap, the original ref + reason (historical immutability: the
  // plan is never edited, the swap lives on the log — see migration 015).
  const saveExerciseSets = useCallback(
    async (
      exerciseId: string,
      exerciseName: string,
      sets: ExerciseSet[],
      orderIndex: number,
      opts?: { swappedFromRef?: string; swapReason?: string },
    ) => {
      setState((s) => ({ ...s, saving: true }))

      const logId = await ensureWorkoutLog()
      if (!logId || !user) {
        setState((s) => ({ ...s, saving: false }))
        return
      }

      // Denormalize the session's BEST (lowest) ladder value for the trend
      // (assist_reduction exercises only; null otherwise). Progress = lower.
      const assistVals = sets.map((s) => s.assist_kg).filter((v): v is number => typeof v === 'number')
      const surfaceVals = sets.map((s) => s.surface_level).filter((v): v is number => typeof v === 'number')
      const ladder_assist_kg = assistVals.length ? Math.min(...assistVals) : null
      const ladder_surface_level = surfaceVals.length ? Math.min(...surfaceVals) : null

      const { data: existingLog } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('workout_log_id', logId)
        .eq('exercise_id', exerciseId)
        .maybeSingle()

      if (existingLog) {
        await supabase
          .from('exercise_logs')
          .update({ sets, exercise_name: exerciseName, ladder_assist_kg, ladder_surface_level })
          .eq('id', existingLog.id)
      } else {
        await supabase.from('exercise_logs').insert({
          user_id: user.id,
          workout_log_id: logId,
          exercise_id: exerciseId,
          library_exercise_id: exerciseId,
          exercise_name: exerciseName,
          order_index: orderIndex,
          sets,
          ladder_assist_kg,
          ladder_surface_level,
          swapped_from_ref: opts?.swappedFromRef ?? null,
          swap_reason: opts?.swapReason ?? null,
          is_ad_hoc: false,
        })
      }

      setState((s) => ({
        ...s,
        saving: false,
        loggedExercises: { ...s.loggedExercises, [exerciseId]: sets },
      }))
    },
    [user, ensureWorkoutLog],
  )

  const finishWorkout = useCallback(async (opts?: { prehabSkipped?: boolean }): Promise<{
    duration: number
    totalVolume: number
    exerciseCount: number
  } | null> => {
    const logId = workoutLogIdRef.current
    if (!logId) return null

    setState((s) => ({ ...s, saving: true }))

    const patch: Record<string, unknown> = { completed_at: new Date().toISOString() }
    if (opts?.prehabSkipped) patch.prehab_skipped = true

    await supabase
      .from('workout_logs')
      .update(patch)
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
    saveExerciseSets,
    finishWorkout,
  }
}
