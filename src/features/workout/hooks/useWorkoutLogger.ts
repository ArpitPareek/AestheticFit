import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import { localTodayISO } from '../../../lib/utils'
import type { ExerciseSet } from '../../../lib/types'
import type { InsertTables, Json, UpdateTables } from '../../../types/supabase'


interface WorkoutLoggerState {
  workoutLogId: string | null
  startedAt: Date | null
  loggedExercises: Record<string, ExerciseSet[]>
  /** Maps original plan ref.id → swapped-to exercise_id for today's log. */
  swapMap: Record<string, string>
  saving: boolean
  finished: boolean
  /** Non-null while the 5-second "Undo" window on a just-finished workout is open. */
  pendingUndo: { workoutLogId: string; timer: ReturnType<typeof setTimeout> } | null
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
    pendingUndo: null,
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
    setState((s) => {
      if (s.pendingUndo) clearTimeout(s.pendingUndo.timer)
      return { ...s, workoutLogId: null, startedAt: null, loggedExercises: {}, swapMap: {}, finished: false, pendingUndo: null }
    })
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
        logged[row.exercise_id] = (row.sets as unknown as ExerciseSet[]) ?? []
        if (row.swapped_from_ref) swaps[row.swapped_from_ref] = row.exercise_id
      }
      setState((s) => ({
        ...s,
        workoutLogId: log.id,
        startedAt: log.started_at ? new Date(log.started_at) : s.startedAt,
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

    // Snapshot the plan version that was active when this session ran, so
    // historical logs stay tied to the plan they were performed under even
    // after advanceToNextPhase writes a new workout_plans row (B11).
    // plan_version_id (uuid) resolves to the active plan row; plan_version
    // (integer) mirrors plan_version on that row so old joins keep working.
    const { data: planRow } = await supabase
      .from('workout_plans')
      .select('id, plan_version')
      .eq('id', planId)
      .maybeSingle()
    const planVersion = planRow?.plan_version ?? 1

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        plan_id: planId,
        plan_version: planVersion,
        plan_version_id: planId,
        workout_date: workoutDate,
        day_label: dayLabel,
        started_at: new Date().toISOString(),
      } satisfies InsertTables<'workout_logs'>)
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
          .update({ sets: updatedSets as unknown as Json })
          .eq('id', existingLog.id)
      } else {
        const payload: InsertTables<'exercise_logs'> = {
          user_id: user.id,
          workout_log_id: logId,
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          order_index: orderIndex,
          sets: updatedSets as unknown as Json,
          is_ad_hoc: false,
        }
        await supabase.from('exercise_logs').insert(payload)
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
          .update({
            sets: sets as unknown as Json,
            exercise_name: exerciseName,
            ladder_assist_kg,
            ladder_surface_level,
          })
          .eq('id', existingLog.id)
      } else {
        await supabase.from('exercise_logs').insert({
          user_id: user.id,
          workout_log_id: logId,
          exercise_id: exerciseId,
          library_exercise_id: exerciseId,
          exercise_name: exerciseName,
          order_index: orderIndex,
          sets: sets as unknown as Json,
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

  const finishWorkout = useCallback(async (opts?: { prehabSkipped?: boolean; calories?: number | null }): Promise<{
    duration: number
    /** Explicit, user-correctable duration persisted at finish; null when the
     *  elapsed timestamp delta was too small to trust (< 5 min — first-save-to-
     *  finish burst) and the user should type the real value. */
    duration_min: number | null
    totalVolume: number
    exerciseCount: number
    calories: number | null
    /** false when RLS rejected the finish write (session outside the editable window). */
    persisted: boolean
  } | null> => {
    const logId = workoutLogIdRef.current
    if (!logId) return null

    // B10: never stamp completed_at on a session with zero exercise_logs — that
    // silently ticked the streak and painted a ✓ on the dashboard for a
    // "Finish anyway" tap on an empty card. A finished workout requires at
    // least one exercise with at least one set.
    const loggedCount = Object.values(state.loggedExercises).filter((sets) => sets.length > 0).length
    if (loggedCount === 0) {
      return null
    }

    setState((s) => ({ ...s, saving: true }))

    const duration = state.startedAt
      ? Math.round((Date.now() - state.startedAt.getTime()) / 60000)
      : 0

    const patch: UpdateTables<'workout_logs'> = { completed_at: new Date().toISOString() }
    if (opts?.prehabSkipped) patch.prehab_skipped = true
    // Display-only strength estimate (see strengthCalories.ts). Never fed into
    // nutrition targets — the adaptive TDEE engine already captures training.
    const calories = opts?.calories != null && opts.calories > 0 ? opts.calories : null
    if (calories != null) {
      patch.calories = calories
      patch.calories_source = 'estimated'
    }
    // Seed duration_min from the elapsed value ONLY when it's plausible. The
    // timestamp delta is known-bad when sets are logged in a burst (started_at =
    // first save, completed_at = finish), so anything under 5 min is left NULL for
    // the user to fill in on the summary card (see migration 059). Never fed into
    // calories — estimateStrengthCalories is intentionally duration-independent.
    const duration_min = duration >= 5 ? duration : null
    if (duration_min != null) patch.duration_min = duration_min

    // .select() so we can tell whether the row was actually written: the
    // immutability RLS policy (052/058) silently updates 0 rows for a session
    // outside the editable window, and a bare update reports no error for that.
    const { data: updated } = await supabase
      .from('workout_logs')
      .update(patch)
      .eq('id', logId)
      .select('id')
    const persisted = (updated?.length ?? 0) > 0

    let totalVolume = 0
    let exerciseCount = 0
    for (const sets of Object.values(state.loggedExercises)) {
      if (sets.length > 0) exerciseCount++
      for (const s of sets) {
        totalVolume += s.weight_kg * s.reps
      }
    }

    // B37-workout: 5-second undo window. Soft-deletes via `deleted_at` (migration
    // 056) rather than a hard delete, matching the SELECT policy that hides
    // deleted_at IS NOT NULL rows — same 1-day recency UPDATE policy from 052
    // already covers this write.
    const timer = setTimeout(() => {
      // `deleted_at` predates the last `supabase gen types` run (migration 056) —
      // cast until types are regenerated against the live schema.
      const softDelete = { deleted_at: new Date().toISOString() } as unknown as UpdateTables<'workout_logs'>
      void supabase.from('workout_logs').update(softDelete).eq('id', logId)
      setState((s) => (s.pendingUndo?.workoutLogId === logId ? { ...s, pendingUndo: null } : s))
    }, 5000)

    setState((s) => ({ ...s, saving: false, finished: true, pendingUndo: { workoutLogId: logId, timer } }))
    return { duration, duration_min, totalVolume, exerciseCount, calories, persisted }
  }, [state.startedAt, state.loggedExercises])

  // User-correctable duration. finishWorkout seeds duration_min only when the
  // timestamp delta is plausible; this lets the summary card record the real
  // session length (or fix a wrong seed). Uses .select() to confirm the write
  // survived the immutability RLS window, mirroring finishWorkout.
  const updateDuration = useCallback(
    async (minutes: number): Promise<boolean> => {
      const logId = workoutLogIdRef.current
      if (!logId) return false
      const clamped = Math.max(0, Math.min(600, Math.round(minutes)))
      const { data } = await supabase
        .from('workout_logs')
        .update({ duration_min: clamped } satisfies UpdateTables<'workout_logs'>)
        .eq('id', logId)
        .select('id')
      return (data?.length ?? 0) > 0
    },
    [],
  )

  const undoFinish = useCallback(() => {
    setState((s) => {
      if (!s.pendingUndo) return s
      clearTimeout(s.pendingUndo.timer)
      return { ...s, pendingUndo: null, finished: false }
    })
  }, [])

  return {
    ...state,
    logSet,
    saveExerciseSets,
    finishWorkout,
    updateDuration,
    undoFinish,
  }
}
