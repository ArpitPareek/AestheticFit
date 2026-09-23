import { useEffect, useRef, useState } from 'react'
import { Check, Clock } from 'lucide-react'
import type { AssessmentResponses } from '../profile/types'
import type { WorkoutPlanRow } from './planGenerator'
import { activatePlan, generateDraftPlan } from './planGenerator'
import { useExerciseNames } from './hooks/useExerciseNames'
import type { PlanDay, PlanSlotExercise } from './planTypes'

interface Props {
  assessment: AssessmentResponses
  userId: string
  draftPlan: WorkoutPlanRow | null
  onActivated: () => void
}

export function PlanReview({ userId, draftPlan, onActivated }: Props) {
  const [generating, setGenerating] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState('')
  const generateStarted = useRef(false)

  useEffect(() => {
    if (draftPlan || generateStarted.current) return
    generateStarted.current = true
    setGenerating(true)
    generateDraftPlan(userId)
      .then(() => onActivated()) // reload() — repopulates draftPlan from context
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to generate plan'))
      .finally(() => setGenerating(false))
  }, [draftPlan, userId, onActivated])

  const allIds = draftPlan?.plan_data.days.flatMap((d) => d.exercises.map((e) => e.ref.id)) ?? []
  const { names } = useExerciseNames(allIds)

  const handleStart = async () => {
    if (!draftPlan) return
    setActivating(true)
    setError('')
    try {
      await activatePlan(userId, draftPlan.id)
      onActivated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start plan')
    } finally {
      setActivating(false)
    }
  }

  if (!draftPlan) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-slate-400">{generating ? 'Generating your plan…' : 'Loading…'}</p>
          </>
        )}
      </div>
    )
  }

  const { plan_name: planName, phase, total_phases: totalPhases, plan_data: planData } = draftPlan

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-white">{planName}</h1>
        <p className="text-xs text-slate-400">
          Phase {phase} of {totalPhases} · {planData.days.length} sessions/week
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {planData.days.map((day, i) => (
          <DayCard key={`${day.label}-${i}`} day={day} names={names} />
        ))}
      </div>

      {error && <div className="mx-4 mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      <div className="sticky bottom-0 border-t border-slate-800 bg-background px-4 py-3">
        <button
          type="button"
          onClick={handleStart}
          disabled={activating}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3.5 font-semibold text-white transition-colors active:bg-emerald-700 disabled:opacity-50"
        >
          <Check size={18} />
          {activating ? 'Starting…' : 'Start this plan'}
        </button>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}

function DayCard({ day, names }: { day: PlanDay; names: Record<string, string> }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-sm font-semibold text-white">{day.label}</p>
      </div>
      <div className="divide-y divide-slate-800">
        {day.exercises.map((entry, i) => (
          <ExerciseRow key={`${entry.ref.id}-${i}`} entry={entry} name={names[entry.ref.id] ?? entry.ref.id} />
        ))}
      </div>
    </div>
  )
}

function ExerciseRow({ entry, name }: { entry: PlanSlotExercise; name: string }) {
  const reps = entry.rep_low === entry.rep_high ? `${entry.rep_low}` : `${entry.rep_low}–${entry.rep_high}`
  return (
    <div className="px-4 py-2.5">
      <p className="text-xs font-medium text-slate-200">{name}</p>
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
        {entry.sets} × {reps} reps · RIR {entry.rir}
        <span className="mx-1 text-slate-700">·</span>
        <Clock size={10} /> {entry.rest_s}s rest
      </p>
      {entry.note && <p className="mt-0.5 text-[11px] italic text-slate-500">{entry.note}</p>}
    </div>
  )
}
