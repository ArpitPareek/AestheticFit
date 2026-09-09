import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  ExternalLink,
  Flame,
  Minus,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Square,
  Trophy,
  X,
  Check,
  Timer,
  Zap,
} from 'lucide-react'
import { useProfile } from '../profile/ProfileContext'
import { useTodayWorkout } from './hooks/useTodayWorkout'
import { useExerciseHistory, type ExerciseHistory } from './hooks/useExerciseHistory'
import { useWorkoutLogger } from './hooks/useWorkoutLogger'
import {
  getRecommendation,
  formatLastSession,
  setComparison,
  type Recommendation,
} from './ProgressEngine'
import { EXERCISE_MAP, type Exercise } from '../../lib/constants/exercises'
import type {
  ExerciseSet,
  GeneratedDayPlan,
  PlanExerciseEntry,
  PlanCoreEntry,
  PlanOverloadRules,
} from '../../lib/types'

// ─── Rest Day ──────────────────────────────────────────────
function RestDay() {
  const tips = [
    'Take a 20-30 minute walk to aid recovery',
    'Focus on hydration — aim for 3+ liters today',
    'Do 10 minutes of light stretching or foam rolling',
    'Get 7-9 hours of quality sleep tonight',
    'Eat at maintenance calories with adequate protein',
  ]
  const tip = tips[new Date().getDay() % tips.length]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-6 text-center">
        <Moon size={48} className="mx-auto mb-4 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Rest Day</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Enjoy your recovery. Muscles are built during rest, not during training.
        </p>
      </div>
      <div className="rounded-2xl bg-card p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Recovery tip
        </h3>
        <p className="text-sm text-slate-300">{tip}</p>
      </div>
    </div>
  )
}

// ─── Rest Timer ────────────────────────────────────────────
function RestTimer({
  seconds,
  onDone,
  onSkip,
}: {
  seconds: number
  onDone: () => void
  onSkip: () => void
}) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setRemaining(seconds)
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!)
          try {
            navigator.vibrate?.(300)
          } catch {}
          onDone()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [seconds])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const pct = ((seconds - remaining) / seconds) * 100

  return (
    <div className="fixed bottom-20 left-0 right-0 z-20 px-4 pb-2">
      <div className="rounded-2xl bg-slate-800 p-3 shadow-lg shadow-black/40">
        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-emerald-400" />
            <span className="text-sm font-medium text-white">
              Rest: {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="rounded-lg px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Set Input Row ─────────────────────────────────────────
function SetInput({
  setNumber,
  defaultWeight,
  defaultReps,
  onLog,
}: {
  setNumber: number
  defaultWeight: number
  defaultReps: number
  onLog: (weight: number, reps: number) => void
}) {
  const [weight, setWeight] = useState(defaultWeight)
  const [reps, setReps] = useState(defaultReps)

  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-2">
      <span className="w-8 text-xs text-slate-500">S{setNumber}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setWeight((w) => Math.max(0, w - 2.5))}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-300 active:bg-slate-600"
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          className="h-8 w-16 rounded-lg bg-slate-700 text-center text-sm font-medium text-white outline-none focus:ring-1 focus:ring-emerald-500"
          inputMode="decimal"
        />
        <button
          onClick={() => setWeight((w) => w + 2.5)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-300 active:bg-slate-600"
        >
          <Plus size={14} />
        </button>
        <span className="text-xs text-slate-500">kg</span>
      </div>
      <span className="text-slate-600">×</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setReps((r) => Math.max(1, r - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-300 active:bg-slate-600"
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 0)}
          className="h-8 w-12 rounded-lg bg-slate-700 text-center text-sm font-medium text-white outline-none focus:ring-1 focus:ring-emerald-500"
          inputMode="numeric"
        />
        <button
          onClick={() => setReps((r) => r + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-300 active:bg-slate-600"
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        onClick={() => onLog(weight, reps)}
        className="ml-auto flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white active:bg-emerald-700"
      >
        <Check size={14} /> Log
      </button>
    </div>
  )
}

// ─── Swap Sheet ────────────────────────────────────────────
function SwapSheet({
  alternatives,
  onSelect,
  onClose,
}: {
  alternatives: string[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-slate-800 p-4 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-white">Swap Exercise</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-2">
          {alternatives.map((altId) => {
            const ex = EXERCISE_MAP.get(altId)
            if (!ex) return null
            return (
              <button
                key={altId}
                onClick={() => onSelect(altId)}
                className="flex w-full items-center gap-3 rounded-xl bg-slate-700/50 p-3 text-left transition-colors active:bg-slate-700"
              >
                <Dumbbell size={18} className="shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-white">{ex.name}</p>
                  <p className="text-xs text-slate-400">
                    {ex.primary_muscle} · {ex.equipment.join(', ')}
                  </p>
                </div>
              </button>
            )
          })}
          {alternatives.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">No alternatives available</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Exercise Card ─────────────────────────────────────────
function WorkoutExerciseCard({
  entry,
  exercise,
  history,
  recommendation,
  loggedSets,
  orderIndex,
  onLogSet,
  onSwap,
}: {
  entry: PlanExerciseEntry
  exercise: Exercise | undefined
  history: ExerciseHistory | undefined
  recommendation: Recommendation
  loggedSets: ExerciseSet[]
  orderIndex: number
  onLogSet: (exerciseId: string, exerciseName: string, set: ExerciseSet, orderIndex: number) => void
  onSwap: (exerciseId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [showSwap, setShowSwap] = useState(false)

  const nextSetNumber = loggedSets.length + 1
  const allSetsLogged = loggedSets.length >= entry.targetSets
  const name = exercise?.name ?? entry.exerciseId

  const handleLog = (weight: number, reps: number) => {
    const set: ExerciseSet = {
      set_number: nextSetNumber,
      weight_kg: weight,
      reps,
    }
    onLogSet(entry.exerciseId, name, set, orderIndex)
    if (nextSetNumber >= entry.targetSets) {
      setShowInput(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl bg-card">
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-white">{name}</h4>
              {exercise && (
                <span className="mt-0.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  {exercise.primary_muscle}
                </span>
              )}
            </div>
            {allSetsLogged && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                <Check size={14} className="text-white" />
              </div>
            )}
          </div>

          {/* Target */}
          <p className="mt-2 text-xs text-slate-400">
            {entry.targetSets} × {entry.targetRepsMin}–{entry.targetRepsMax} reps
            {entry.targetRir > 0 && ` | RIR ${entry.targetRir}`} | Rest{' '}
            {entry.restSeconds}s
          </p>

          {/* Last session */}
          <p className="mt-1 text-xs text-slate-500">
            Last: {history ? formatLastSession(history.sets) : 'No data'}
          </p>

          {/* Recommendation */}
          {recommendation.recommendedWeight > 0 && (
            <p className="mt-1 text-xs font-medium text-amber-400">
              → {recommendation.reason}
            </p>
          )}
        </div>

        {/* Logged sets */}
        {loggedSets.length > 0 && (
          <div className="space-y-1 px-4 pb-2">
            {loggedSets.map((s) => {
              const cmp = history ? setComparison(s, history.sets) : null
              return (
                <div
                  key={s.set_number}
                  className="flex items-center gap-2 text-xs text-slate-300"
                >
                  <Check size={12} className="text-emerald-500" />
                  <span>
                    Set {s.set_number}: {s.weight_kg}kg × {s.reps}
                  </span>
                  {cmp === 'up' && <span className="text-emerald-400">▲</span>}
                  {cmp === 'same' && <span className="text-slate-500">=</span>}
                  {cmp === 'down' && <span className="text-red-400">▼</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Set input */}
        {showInput && !allSetsLogged && (
          <div className="px-4 pb-3">
            <SetInput
              setNumber={nextSetNumber}
              defaultWeight={
                loggedSets.length > 0
                  ? loggedSets[loggedSets.length - 1].weight_kg
                  : recommendation.recommendedWeight
              }
              defaultReps={
                loggedSets.length > 0
                  ? loggedSets[loggedSets.length - 1].reps
                  : recommendation.recommendedReps
              }
              onLog={handleLog}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-slate-700/50 px-4 py-2">
          {!allSetsLogged && (
            <button
              onClick={() => setShowInput(!showInput)}
              className="flex items-center gap-1 rounded-lg bg-emerald-600/15 px-3 py-1.5 text-xs font-medium text-emerald-400 active:bg-emerald-600/25"
            >
              <Plus size={14} /> Log Set {nextSetNumber}
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-700/50"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Less' : 'Tips'}
          </button>
          <button
            onClick={() => setShowSwap(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-700/50"
          >
            <RefreshCw size={12} /> Swap
          </button>
        </div>

        {/* Expanded details */}
        {expanded && exercise && (
          <div className="space-y-2 border-t border-slate-700/50 px-4 py-3">
            {exercise.form_cues.length > 0 && (
              <div>
                <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Form Cues
                </h5>
                <ul className="space-y-0.5">
                  {exercise.form_cues.map((cue, i) => (
                    <li key={i} className="text-xs text-slate-300">
                      • {cue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <a
              href={exercise.youtube_search_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400"
            >
              <ExternalLink size={12} /> Watch Tutorial
            </a>
          </div>
        )}
      </div>

      {showSwap && (
        <SwapSheet
          alternatives={entry.alternatives}
          onSelect={(id) => {
            onSwap(id)
            setShowSwap(false)
          }}
          onClose={() => setShowSwap(false)}
        />
      )}
    </>
  )
}

// ─── Core Finisher ─────────────────────────────────────────
function CoreFinisher({ exercises }: { exercises: PlanCoreEntry[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  if (exercises.length === 0) return null

  return (
    <div className="rounded-2xl bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Flame size={16} className="text-orange-400" /> Core Finisher
      </h3>
      <div className="space-y-2">
        {exercises.map((ex, i) => {
          const info = EXERCISE_MAP.get(ex.exerciseId)
          return (
            <label
              key={i}
              className="flex items-center gap-3 rounded-xl bg-slate-800/40 p-3"
            >
              <input
                type="checkbox"
                checked={checked[i] ?? false}
                onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className={`text-sm ${checked[i] ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {info?.name ?? ex.exerciseId}
                </p>
                <p className="text-xs text-slate-500">
                  {ex.sets} × {ex.reps}
                </p>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

// ─── Cardio Section ────────────────────────────────────────
function CardioSection({ cardio }: { cardio: GeneratedDayPlan['cardio'] }) {
  const [done, setDone] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  if (!cardio) return null

  const startTimer = () => {
    setTimerRunning(true)
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }

  const stopTimer = () => {
    setTimerRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <div className="rounded-2xl bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Zap size={16} className="text-yellow-400" /> Cardio
      </h3>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${done ? 'text-slate-500 line-through' : 'text-white'}`}>
            {cardio.type} — {cardio.durationMinutes} min
          </p>
          <p className="text-xs text-slate-500">
            {cardio.intensity} intensity
            {cardio.notes ? ` · ${cardio.notes}` : ''}
          </p>
          {timerRunning && (
            <p className="mt-1 font-mono text-sm text-emerald-400">
              {mins}:{secs.toString().padStart(2, '0')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!done && (
            <button
              onClick={timerRunning ? stopTimer : startTimer}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-white active:bg-slate-600"
            >
              {timerRunning ? <Square size={16} /> : <Play size={16} />}
            </button>
          )}
          <label className="flex h-10 w-10 items-center justify-center">
            <input
              type="checkbox"
              checked={done}
              onChange={() => {
                setDone(!done)
                if (timerRunning) stopTimer()
              }}
              className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>
    </div>
  )
}

// ─── Workout Summary Modal ─────────────────────────────────
function WorkoutSummary({
  duration,
  totalVolume,
  exerciseCount,
  onClose,
}: {
  duration: number
  totalVolume: number
  exerciseCount: number
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-sm rounded-2xl bg-card p-6 text-center">
        <Trophy size={48} className="mx-auto mb-3 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Workout Complete!</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-800/50 p-3">
            <p className="text-lg font-bold text-emerald-400">{duration}</p>
            <p className="text-[10px] text-slate-500">minutes</p>
          </div>
          <div className="rounded-xl bg-slate-800/50 p-3">
            <p className="text-lg font-bold text-emerald-400">{exerciseCount}</p>
            <p className="text-[10px] text-slate-500">exercises</p>
          </div>
          <div className="rounded-xl bg-slate-800/50 p-3">
            <p className="text-lg font-bold text-emerald-400">
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </p>
            <p className="text-[10px] text-slate-500">kg volume</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white active:bg-emerald-700"
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────
export function TodayWorkout() {
  const { activePlan } = useProfile()
  const plan = activePlan?.plan_data ?? null
  const planId = activePlan?.id ?? null

  const { dayPlan, phase, currentWeek, isRestDay, isDeloadWeek } = useTodayWorkout(
    plan,
    activePlan?.start_date ?? null,
  )

  // Collect all exercise IDs for history lookup
  const exerciseIds = useMemo(() => {
    if (!dayPlan) return []
    const ids = [
      ...dayPlan.mainExercises.map((e) => e.exerciseId),
      ...dayPlan.accessories.map((e) => e.exerciseId),
    ]
    return [...new Set(ids)]
  }, [dayPlan])

  const { history } = useExerciseHistory(exerciseIds)
  const { loggedExercises, logSet, finishWorkout, saving, finished } = useWorkoutLogger(
    planId,
    dayPlan?.dayLabel ?? '',
  )

  // Swapped exercises: exerciseId → replacementId
  const [swaps, setSwaps] = useState<Record<string, string>>({})
  const [warmupExpanded, setWarmupExpanded] = useState(true)
  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null)
  const [summary, setSummary] = useState<{
    duration: number
    totalVolume: number
    exerciseCount: number
  } | null>(null)

  const handleLogSet = useCallback(
    (exerciseId: string, exerciseName: string, set: ExerciseSet, orderIndex: number) => {
      logSet(exerciseId, exerciseName, set, orderIndex)
      // Find the rest time for this exercise
      const entry =
        dayPlan?.mainExercises.find((e) => e.exerciseId === exerciseId) ??
        dayPlan?.accessories.find((e) => e.exerciseId === exerciseId)
      if (entry) {
        setRestTimer({ seconds: entry.restSeconds })
      }
    },
    [logSet, dayPlan],
  )

  const handleSwap = useCallback(
    (originalId: string) => (replacementId: string) => {
      setSwaps((s) => ({ ...s, [originalId]: replacementId }))
    },
    [],
  )

  const handleFinish = useCallback(async () => {
    const result = await finishWorkout()
    if (result) setSummary(result)
  }, [finishWorkout])

  const overloadRules: PlanOverloadRules = plan?.overloadRules ?? {
    linearProgression: '',
    doubleProgression: '',
    failureProtocol: '',
    deloadProtocol: '',
  }

  // ─── Loading state ──────────────────────────────────────
  if (!activePlan) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">No active plan. Complete your assessment first.</p>
      </div>
    )
  }

  if (isRestDay) {
    return <RestDay />
  }

  if (!dayPlan) {
    return <RestDay />
  }

  const resolveEntry = (entry: PlanExerciseEntry): { entry: PlanExerciseEntry; exercise: Exercise | undefined } => {
    const swappedId = swaps[entry.exerciseId] ?? entry.exerciseId
    return {
      entry: { ...entry, exerciseId: swappedId },
      exercise: EXERCISE_MAP.get(swappedId),
    }
  }

  const allExercises = [...dayPlan.mainExercises, ...dayPlan.accessories]
  const totalExercises = allExercises.length
  const completedExercises = allExercises.filter(
    (e) => (loggedExercises[swaps[e.exerciseId] ?? e.exerciseId]?.length ?? 0) >= e.targetSets,
  ).length

  return (
    <div className="space-y-4 pb-24">
      {/* Header Card */}
      <div className="rounded-2xl bg-card p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Clock size={12} />
          <span>~{dayPlan.estimatedMinutes} min</span>
          {isDeloadWeek && (
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
              Deload Week
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold text-white">{dayPlan.dayLabel}</h2>
        {phase && (
          <p className="mt-1 text-xs text-slate-400">
            Phase {phase.phaseNumber} of {plan!.phases.length} — {phase.name} · Week {currentWeek}
          </p>
        )}
        {phase?.description && (
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{phase.description}</p>
        )}
        {/* Progress bar */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Progress</span>
            <span>
              {completedExercises}/{totalExercises}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warmup */}
      {dayPlan.warmup.length > 0 && (
        <div className="rounded-2xl bg-card">
          <button
            onClick={() => setWarmupExpanded(!warmupExpanded)}
            className="flex w-full items-center justify-between p-4"
          >
            <h3 className="text-sm font-semibold text-white">Warmup</h3>
            {warmupExpanded ? (
              <ChevronUp size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )}
          </button>
          {warmupExpanded && (
            <div className="space-y-2 px-4 pb-4">
              <p className="text-xs text-slate-400">5 min light cardio + dynamic stretches</p>
              {dayPlan.warmup.map((w, i) => {
                const info = EXERCISE_MAP.get(w.exerciseId)
                return (
                  <div key={i} className="rounded-xl bg-slate-800/40 p-3">
                    <p className="text-sm text-white">{info?.name ?? w.exerciseId}</p>
                    <p className="text-xs text-slate-500">
                      {w.sets} × {w.reps}
                      {w.notes ? ` — ${w.notes}` : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Exercises */}
      {dayPlan.mainExercises.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Dumbbell size={14} /> Main Lifts
          </h3>
          {dayPlan.mainExercises.map((entry, i) => {
            const { entry: resolved, exercise } = resolveEntry(entry)
            const rec = getRecommendation(
              resolved,
              history[resolved.exerciseId]
                ? [{ date: history[resolved.exerciseId].workout_date, sets: history[resolved.exerciseId].sets }]
                : [],
              overloadRules,
              isDeloadWeek,
            )
            return (
              <WorkoutExerciseCard
                key={resolved.exerciseId + '-' + i}
                entry={resolved}
                exercise={exercise}
                history={history[resolved.exerciseId]}
                recommendation={rec}
                loggedSets={loggedExercises[resolved.exerciseId] ?? []}
                orderIndex={i}
                onLogSet={handleLogSet}
                onSwap={handleSwap(entry.exerciseId)}
              />
            )
          })}
        </div>
      )}

      {/* Accessories */}
      {dayPlan.accessories.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Accessories
          </h3>
          {dayPlan.accessories.map((entry, i) => {
            const { entry: resolved, exercise } = resolveEntry(entry)
            const rec = getRecommendation(
              resolved,
              history[resolved.exerciseId]
                ? [{ date: history[resolved.exerciseId].workout_date, sets: history[resolved.exerciseId].sets }]
                : [],
              overloadRules,
              isDeloadWeek,
            )
            return (
              <WorkoutExerciseCard
                key={resolved.exerciseId + '-acc-' + i}
                entry={resolved}
                exercise={exercise}
                history={history[resolved.exerciseId]}
                recommendation={rec}
                loggedSets={loggedExercises[resolved.exerciseId] ?? []}
                orderIndex={dayPlan.mainExercises.length + i}
                onLogSet={handleLogSet}
                onSwap={handleSwap(entry.exerciseId)}
              />
            )
          })}
        </div>
      )}

      {/* Core Finisher */}
      <CoreFinisher exercises={dayPlan.coreFinisher} />

      {/* Cardio */}
      <CardioSection cardio={dayPlan.cardio} />

      {/* Cooldown */}
      {dayPlan.cooldown && (
        <div className="rounded-2xl bg-card p-4">
          <h3 className="mb-1 text-sm font-semibold text-white">Cooldown</h3>
          <p className="text-xs text-slate-400">{dayPlan.cooldown}</p>
        </div>
      )}

      {/* Finish Workout */}
      {!finished && Object.keys(loggedExercises).length > 0 && (
        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white active:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Finish Workout'}
        </button>
      )}

      {/* Rest Timer */}
      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          onDone={() => setRestTimer(null)}
          onSkip={() => setRestTimer(null)}
        />
      )}

      {/* Summary Modal */}
      {summary && (
        <WorkoutSummary
          duration={summary.duration}
          totalVolume={summary.totalVolume}
          exerciseCount={summary.exerciseCount}
          onClose={() => setSummary(null)}
        />
      )}
    </div>
  )
}
