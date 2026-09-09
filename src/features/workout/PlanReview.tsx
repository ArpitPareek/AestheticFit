import { useCallback, useState } from 'react'
import { Check, ChevronDown, Clock, Info, RefreshCw, Shuffle, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { AssessmentResponses } from '../profile/types'
import type { GeneratedWorkoutPlan, GeneratedDayPlan, GeneratedPhase, PlanExerciseEntry } from '../../lib/types'
import { EXERCISE_MAP } from '../../lib/constants/exercises'
import { generatePlan } from './planGenerator'

interface Props {
  assessment: AssessmentResponses
  assessmentId: string
  onApproved: () => void
}

export function PlanReview({ assessment, assessmentId, onApproved }: Props) {
  const { user } = useAuth()
  const [plan, setPlan] = useState<GeneratedWorkoutPlan>(() => generatePlan(assessment))
  const [expandedPhase, setExpandedPhase] = useState<number>(1)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showRationale, setShowRationale] = useState(false)
  const [swapping, setSwapping] = useState<{ phaseIdx: number; dayIdx: number; section: 'main' | 'acc'; exIdx: number } | null>(null)

  const handleRegenerate = useCallback(() => {
    setPlan(generatePlan(assessment))
    setExpandedPhase(1)
    setExpandedDay(null)
  }, [assessment])

  const handleApprove = useCallback(async () => {
    if (!user) return
    setSaving(true)
    setError('')

    try {
      // Deactivate any existing active plan
      await supabase
        .from('workout_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true)

      const { error: insertErr } = await supabase.from('workout_plans').insert({
        user_id: user.id,
        assessment_id: assessmentId,
        plan_version: 1,
        plan_name: plan.planName,
        plan_data: plan,
        phase: 1,
        total_phases: plan.phases.length,
        weeks_per_phase: plan.phases[0].weekEnd - plan.phases[0].weekStart + 1,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true,
      })

      if (insertErr) throw insertErr
      onApproved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }, [user, plan, assessmentId, onApproved])

  const handleSwap = useCallback(
    (phaseIdx: number, dayIdx: number, section: 'main' | 'acc', exIdx: number, newExId: string) => {
      setPlan((prev) => {
        const next = structuredClone(prev)
        const day = next.phases[phaseIdx].weeklySchedule[dayIdx]
        const list = section === 'main' ? day.mainExercises : day.accessories
        const entry = list[exIdx]
        const newEx = EXERCISE_MAP.get(newExId)
        if (newEx) {
          entry.exerciseId = newExId
          entry.alternatives = entry.alternatives.filter((id) => id !== newExId)
          entry.alternatives.push(list[exIdx].exerciseId)
        }
        return next
      })
      setSwapping(null)
    },
    [],
  )

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{plan.planName}</h1>
            <p className="text-xs text-slate-400">{plan.totalWeeks} weeks · {plan.phases.length} phases</p>
          </div>
          <button
            type="button"
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors active:bg-slate-800"
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Rationale */}
        <button
          type="button"
          onClick={() => setShowRationale((p) => !p)}
          className="w-full rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-left transition-colors active:bg-blue-500/10"
        >
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-400 shrink-0" />
            <span className="text-sm font-medium text-blue-400">Why this plan?</span>
            <ChevronDown size={14} className={`ml-auto text-blue-400 transition-transform ${showRationale ? 'rotate-180' : ''}`} />
          </div>
          {showRationale && (
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{plan.rationale}</p>
          )}
        </button>

        {/* Phases */}
        {plan.phases.map((phase, pi) => (
          <PhaseCard
            key={phase.phaseNumber}
            phase={phase}
            phaseIdx={pi}
            expanded={expandedPhase === phase.phaseNumber}
            onToggle={() => setExpandedPhase((p) => (p === phase.phaseNumber ? -1 : phase.phaseNumber))}
            expandedDay={expandedDay}
            onToggleDay={(key) => setExpandedDay((p) => (p === key ? null : key))}
            swapping={swapping}
            onSwapStart={(dayIdx, section, exIdx) => setSwapping({ phaseIdx: pi, dayIdx, section, exIdx })}
            onSwap={(dayIdx, section, exIdx, newExId) => handleSwap(pi, dayIdx, section, exIdx, newExId)}
            onSwapCancel={() => setSwapping(null)}
          />
        ))}

        {/* Overload rules */}
        <div className="rounded-xl border border-slate-700 bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <Zap size={14} />
            Progression Rules
          </h3>
          <RuleItem label="Linear Progression" text={plan.overloadRules.linearProgression} />
          <RuleItem label="Double Progression" text={plan.overloadRules.doubleProgression} />
          <RuleItem label="Failure Protocol" text={plan.overloadRules.failureProtocol} />
          <RuleItem label="Deload Protocol" text={plan.overloadRules.deloadProtocol} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
      )}

      {/* Approve footer */}
      <div className="sticky bottom-0 border-t border-slate-800 bg-background px-4 py-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3.5 font-semibold text-white transition-colors active:bg-emerald-700 disabled:opacity-50"
        >
          <Check size={18} />
          {saving ? 'Saving…' : 'Approve & Start Plan'}
        </button>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────

function PhaseCard({
  phase,
  phaseIdx,
  expanded,
  onToggle,
  expandedDay,
  onToggleDay,
  swapping,
  onSwapStart,
  onSwap,
  onSwapCancel,
}: {
  phase: GeneratedPhase
  phaseIdx: number
  expanded: boolean
  onToggle: () => void
  expandedDay: string | null
  onToggleDay: (key: string) => void
  swapping: { phaseIdx: number; dayIdx: number; section: 'main' | 'acc'; exIdx: number } | null
  onSwapStart: (dayIdx: number, section: 'main' | 'acc', exIdx: number) => void
  onSwap: (dayIdx: number, section: 'main' | 'acc', exIdx: number, newExId: string) => void
  onSwapCancel: () => void
}) {
  const trainingDays = phase.weeklySchedule.filter((d) => d.type !== 'rest')

  return (
    <div className="rounded-xl border border-slate-700 bg-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 text-left flex items-center gap-3 active:bg-white/5 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-bold shrink-0">
          {phase.phaseNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{phase.name}</p>
          <p className="text-[11px] text-slate-400">
            Weeks {phase.weekStart}–{phase.weekEnd} · {trainingDays.length} days/week
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-4 py-3 space-y-2">
          <p className="text-xs text-slate-400 leading-relaxed">{phase.description}</p>

          {/* Week calendar */}
          <div className="grid grid-cols-7 gap-1 mt-2">
            {phase.weeklySchedule.map((day) => {
              const dayKey = `${phase.phaseNumber}-${day.dayOfWeek}`
              const isExpanded = expandedDay === dayKey
              return (
                <DayBadge
                  key={day.dayOfWeek}
                  day={day}
                  active={isExpanded}
                  onClick={() => onToggleDay(dayKey)}
                />
              )
            })}
          </div>

          {/* Expanded day detail */}
          {expandedDay?.startsWith(`${phase.phaseNumber}-`) && (
            <DayDetail
              day={phase.weeklySchedule.find(
                (d) => `${phase.phaseNumber}-${d.dayOfWeek}` === expandedDay,
              )!}
              dayIdx={phase.weeklySchedule.findIndex(
                (d) => `${phase.phaseNumber}-${d.dayOfWeek}` === expandedDay,
              )}
              phaseIdx={phaseIdx}
              swapping={swapping}
              onSwapStart={onSwapStart}
              onSwap={onSwap}
              onSwapCancel={onSwapCancel}
            />
          )}

          {phase.deloadWeek && (
            <p className="text-[11px] text-yellow-400/80 mt-2">
              Week {phase.deloadWeek} is a deload week — same exercises at 60% weight
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function DayBadge({ day, active, onClick }: { day: GeneratedDayPlan; active: boolean; onClick: () => void }) {
  const label = day.dayOfWeek.slice(0, 3).toUpperCase()
  const isRest = day.type === 'rest'

  const bg = active
    ? 'bg-emerald-500/30 border-emerald-500'
    : isRest
      ? 'bg-slate-800/50 border-slate-800'
      : 'bg-slate-800 border-slate-700'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-1 py-2 text-center transition-colors active:bg-white/5 ${bg}`}
    >
      <p className="text-[9px] font-medium text-slate-400">{label}</p>
      {isRest ? (
        <p className="text-[9px] text-slate-600 mt-0.5">Rest</p>
      ) : (
        <>
          <p className="text-[10px] font-medium text-white mt-0.5 truncate">{day.dayLabel}</p>
          <p className="text-[9px] text-slate-500 flex items-center justify-center gap-0.5 mt-0.5">
            <Clock size={8} />
            {day.estimatedMinutes}m
          </p>
        </>
      )}
    </button>
  )
}

function DayDetail({
  day,
  dayIdx,
  phaseIdx,
  swapping,
  onSwapStart,
  onSwap,
  onSwapCancel,
}: {
  day: GeneratedDayPlan
  dayIdx: number
  phaseIdx: number
  swapping: { phaseIdx: number; dayIdx: number; section: 'main' | 'acc'; exIdx: number } | null
  onSwapStart: (dayIdx: number, section: 'main' | 'acc', exIdx: number) => void
  onSwap: (dayIdx: number, section: 'main' | 'acc', exIdx: number, newExId: string) => void
  onSwapCancel: () => void
}) {
  if (day.type === 'rest') {
    return (
      <div className="rounded-lg bg-slate-800/50 px-3 py-3 mt-2">
        <p className="text-xs text-slate-400">Rest day — focus on recovery, sleep, and nutrition.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-slate-800/50 px-3 py-3 mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{day.dayLabel}</h4>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock size={12} />
          ~{day.estimatedMinutes} min
        </span>
      </div>

      {/* Warmup */}
      {day.warmup.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-yellow-400 mb-1">WARM-UP</p>
          {day.warmup.map((w) => (
            <ExerciseRow key={w.exerciseId} exerciseId={w.exerciseId} detail={`${w.sets} × ${w.reps}`} />
          ))}
        </div>
      )}

      {/* Main */}
      {day.mainExercises.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-emerald-400 mb-1">MAIN EXERCISES</p>
          {day.mainExercises.map((entry, i) => {
            const isSwapping = swapping?.phaseIdx === phaseIdx && swapping?.dayIdx === dayIdx && swapping?.section === 'main' && swapping?.exIdx === i
            return (
              <div key={`${entry.exerciseId}-${i}`}>
                <ExerciseEntryRow
                  entry={entry}
                  onSwap={() => onSwapStart(dayIdx, 'main', i)}
                />
                {isSwapping && (
                  <SwapPicker
                    alternatives={entry.alternatives}
                    onPick={(id) => onSwap(dayIdx, 'main', i, id)}
                    onCancel={onSwapCancel}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Accessories */}
      {day.accessories.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-blue-400 mb-1">ACCESSORIES</p>
          {day.accessories.map((entry, i) => {
            const isSwapping = swapping?.phaseIdx === phaseIdx && swapping?.dayIdx === dayIdx && swapping?.section === 'acc' && swapping?.exIdx === i
            return (
              <div key={`${entry.exerciseId}-${i}`}>
                <ExerciseEntryRow
                  entry={entry}
                  onSwap={() => onSwapStart(dayIdx, 'acc', i)}
                />
                {isSwapping && (
                  <SwapPicker
                    alternatives={entry.alternatives}
                    onPick={(id) => onSwap(dayIdx, 'acc', i, id)}
                    onCancel={onSwapCancel}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Core */}
      {day.coreFinisher.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-orange-400 mb-1">CORE FINISHER</p>
          {day.coreFinisher.map((c) => (
            <ExerciseRow key={c.exerciseId} exerciseId={c.exerciseId} detail={`${c.sets} × ${c.reps}`} />
          ))}
        </div>
      )}

      {/* Cardio */}
      {day.cardio && (
        <div>
          <p className="text-[10px] font-medium text-pink-400 mb-1">CARDIO</p>
          <p className="text-xs text-slate-300">
            {day.cardio.type} · {day.cardio.durationMinutes} min · {day.cardio.intensity}
          </p>
          {day.cardio.notes && <p className="text-[11px] text-slate-500">{day.cardio.notes}</p>}
        </div>
      )}

      {day.cooldown && (
        <p className="text-[11px] text-slate-500 italic">{day.cooldown}</p>
      )}
    </div>
  )
}

function ExerciseRow({ exerciseId, detail }: { exerciseId: string; detail: string }) {
  const ex = EXERCISE_MAP.get(exerciseId)
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-300">{ex?.name ?? exerciseId}</span>
      <span className="text-[11px] text-slate-500">{detail}</span>
    </div>
  )
}

function ExerciseEntryRow({ entry, onSwap }: { entry: PlanExerciseEntry; onSwap: () => void }) {
  const ex = EXERCISE_MAP.get(entry.exerciseId)
  const reps = entry.targetRepsMin === entry.targetRepsMax
    ? `${entry.targetRepsMin}`
    : `${entry.targetRepsMin}–${entry.targetRepsMax}`

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-200 truncate">{ex?.name ?? entry.exerciseId}</p>
        <p className="text-[11px] text-slate-500">
          {entry.targetSets} × {reps} · RIR {entry.targetRir} · {entry.restSeconds}s rest
        </p>
      </div>
      {entry.alternatives.length > 0 && (
        <button
          type="button"
          onClick={onSwap}
          className="shrink-0 p-1.5 rounded-lg text-slate-500 active:bg-white/5 transition-colors"
          aria-label="Swap exercise"
        >
          <Shuffle size={14} />
        </button>
      )}
    </div>
  )
}

function SwapPicker({ alternatives, onPick, onCancel }: { alternatives: string[]; onPick: (id: string) => void; onCancel: () => void }) {
  return (
    <div className="ml-2 mb-2 rounded-lg border border-slate-700 bg-slate-900 p-2 space-y-1">
      <p className="text-[10px] text-slate-400 mb-1">Swap with:</p>
      {alternatives.map((id) => {
        const ex = EXERCISE_MAP.get(id)
        if (!ex) return null
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            className="w-full text-left rounded-md px-2 py-1.5 text-xs text-slate-300 active:bg-slate-800 transition-colors"
          >
            {ex.name}
          </button>
        )
      })}
      <button
        type="button"
        onClick={onCancel}
        className="w-full text-center rounded-md px-2 py-1 text-[11px] text-slate-500 active:bg-slate-800"
      >
        Cancel
      </button>
    </div>
  )
}

function RuleItem({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
    </div>
  )
}
