import { useState, useEffect, useRef, useCallback } from 'react'
import { Sun, Moon, Scissors, ChevronDown, ChevronUp, Timer, AlertTriangle, ClipboardCheck } from 'lucide-react'
import { useProfile } from '../profile/ProfileContext'
import { useSkinLogs } from './hooks/useSkinLogs'
import { useSkinCheckins } from './hooks/useSkinCheckins'
import { localDateISO } from '../../lib/utils'
import { SkinCheckinForm, CheckinHistory } from './SkinCheckin'
import {
  getRoutineForProfile,
  getDayOfWeek,
  getAmStepsForDay,
  DAY_LABELS,
  DAY_ORDER,
  type DayOfWeek,
  type RoutineStep,
} from '../../lib/constants/skincare'

function WaitTimer({ minutes }: { minutes: number }) {
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const start = useCallback(() => {
    setRunning(true)
    setSecondsLeft(minutes * 60)
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [minutes])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!running && secondsLeft === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
        Done!
      </span>
    )
  }

  if (running) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-600/20 px-2 py-0.5 text-[10px] font-medium tabular-nums text-amber-400">
        <Timer size={10} />
        {formatTime(secondsLeft)}
      </span>
    )
  }

  return (
    <button
      onClick={start}
      className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300 transition-colors hover:bg-slate-600 active:bg-slate-500"
    >
      <Timer size={10} />
      {minutes} min
    </button>
  )
}

function RoutineStepRow({
  step,
  checked,
  onToggle,
}: {
  step: RoutineStep
  checked: boolean
  onToggle: () => void
}) {
  const isWait = step.waitMinutes != null

  return (
    <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-800/40 active:bg-slate-800/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-slate-600 bg-slate-800 checked:border-emerald-500 checked:bg-emerald-500"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${checked ? 'text-slate-500 line-through' : 'text-white'}`}>
            {step.product}
          </span>
          {isWait && <WaitTimer minutes={step.waitMinutes!} />}
        </div>
        {step.instruction && !isWait && (
          <p className={`text-[11px] ${checked ? 'text-slate-600' : 'text-slate-400'}`}>
            {step.instruction}
          </p>
        )}
        {step.note && (
          <p className="mt-0.5 text-[10px] italic text-indigo-400/70">
            {step.note}
          </p>
        )}
      </div>
    </label>
  )
}

function RoutineCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  steps,
  stepsChecked,
  onToggle,
}: {
  icon: typeof Sun
  iconColor: string
  title: string
  subtitle: string
  steps: RoutineStep[]
  stepsChecked: Record<string, boolean>
  onToggle: (stepId: string, checked: boolean) => void
}) {
  const doneCount = steps.filter(s => stepsChecked[s.id]).length
  const allDone = doneCount === steps.length && steps.length > 0

  return (
    <div className={`rounded-xl bg-card transition-colors ${allDone ? 'ring-1 ring-emerald-500/30' : ''}`}>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <Icon size={16} className={iconColor} />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-medium ${allDone ? 'text-emerald-400' : 'text-slate-500'}`}>
            {doneCount}/{steps.length}
          </span>
          {allDone && <span className="text-[10px] text-emerald-400">Done</span>}
        </div>
      </div>
      <p className="mb-1 px-4 text-[10px] text-slate-500">{subtitle}</p>
      <div className="px-2 pb-2">
        {steps.map(step => (
          <RoutineStepRow
            key={step.id}
            step={step}
            checked={!!stepsChecked[step.id]}
            onToggle={() => onToggle(step.id, !stepsChecked[step.id])}
          />
        ))}
      </div>
    </div>
  )
}

function DayPicker({ selected, onChange }: { selected: DayOfWeek; onChange: (d: DayOfWeek) => void }) {
  const today = getDayOfWeek()

  return (
    <div className="flex gap-1">
      {DAY_ORDER.map(day => {
        const isToday = day === today
        const isSelected = day === selected
        return (
          <button
            key={day}
            onClick={() => onChange(day)}
            className={`flex h-9 flex-1 flex-col items-center justify-center rounded-lg text-[10px] font-medium transition-colors ${
              isSelected
                ? 'bg-emerald-600 text-white'
                : isToday
                  ? 'bg-slate-700 text-emerald-400'
                  : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800'
            }`}
          >
            {DAY_LABELS[day]}
          </button>
        )
      })}
    </div>
  )
}

function PurgeWarning() {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5">
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
      <p className="text-[11px] leading-relaxed text-amber-400/90">
        Skin purging is normal during weeks 2–6 of tretinoin use. Resist the urge to stop — this means it's working.
      </p>
    </div>
  )
}

export function SkinRoutine() {
  const { profile } = useProfile()
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDayOfWeek())
  const [showCheckin, setShowCheckin] = useState(false)
  const [hairExpanded, setHairExpanded] = useState(false)

  const selectedDate = (() => {
    const today = new Date()
    const todayIdx = (today.getDay() + 6) % 7
    const selectedIdx = DAY_ORDER.indexOf(selectedDay)
    const diff = selectedIdx - todayIdx
    const d = new Date(today)
    d.setDate(today.getDate() + diff)
    return localDateISO(d)
  })()

  const { amLog, pmLog, loading, toggleStep } = useSkinLogs(selectedDate)
  const { checkins, isDue } = useSkinCheckins()

  const routine = getRoutineForProfile(profile?.sex ?? null)
  const amSteps = getAmStepsForDay(routine, selectedDay)
  const pmRoutine = routine.pmRoutines[selectedDay]

  const amChecked = (amLog?.steps_done ?? {}) as Record<string, boolean>
  const pmChecked = (pmLog?.steps_done ?? {}) as Record<string, boolean>

  const usesTretinoin = pmRoutine.steps.some(s =>
    s.product.toLowerCase().includes('tretinoin') ||
    s.note?.toLowerCase().includes('tretinoin')
  )

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-9 animate-pulse rounded-xl bg-card" />
        <div className="h-48 animate-pulse rounded-xl bg-card" />
        <div className="h-48 animate-pulse rounded-xl bg-card" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Day picker */}
      <DayPicker selected={selectedDay} onChange={setSelectedDay} />

      {/* Check-in prompt */}
      {isDue && !showCheckin && (
        <button
          onClick={() => setShowCheckin(true)}
          className="flex w-full items-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-3 text-left transition-colors hover:bg-indigo-500/20"
        >
          <ClipboardCheck size={16} className="shrink-0 text-indigo-400" />
          <div>
            <p className="text-xs font-medium text-indigo-300">Time for your skin check-in</p>
            <p className="text-[10px] text-indigo-400/70">Rate texture, evenness, and hydration</p>
          </div>
        </button>
      )}

      {showCheckin && <SkinCheckinForm onClose={() => setShowCheckin(false)} />}

      {/* Purge warning for tretinoin days */}
      {usesTretinoin && <PurgeWarning />}

      {/* AM Routine */}
      <RoutineCard
        icon={Sun}
        iconColor="text-amber-400"
        title="AM Routine"
        subtitle={`${amSteps.length} steps`}
        steps={amSteps}
        stepsChecked={amChecked}
        onToggle={(stepId, checked) => toggleStep('am', stepId, checked)}
      />

      {/* PM Routine */}
      <RoutineCard
        icon={Moon}
        iconColor="text-indigo-400"
        title={`PM — ${pmRoutine.label}`}
        subtitle={`${pmRoutine.steps.length} steps`}
        steps={pmRoutine.steps}
        stepsChecked={pmChecked}
        onToggle={(stepId, checked) => toggleStep('pm', stepId, checked)}
      />

      {/* Hair section (collapsible) */}
      <div className="rounded-xl bg-card">
        <button
          onClick={() => setHairExpanded(!hairExpanded)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Scissors size={14} className="text-pink-400" />
            <span className="text-xs font-semibold text-white">Hair Care</span>
          </div>
          {hairExpanded ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </button>
        {hairExpanded && (
          <div className="space-y-1.5 px-4 pb-3">
            {routine.hair.steps.map((step, i) => (
              <p key={i} className="text-[11px] text-slate-400">
                <span className="mr-1.5 text-slate-600">{i + 1}.</span>
                {step}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Check-in trend sparklines */}
      <CheckinHistory checkins={checkins} />
    </div>
  )
}
