import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Moon, CalendarDays, Flame } from 'lucide-react'
import { useProfile } from '../profile/ProfileContext'
import { useTodayWorkout } from './hooks/useTodayWorkout'
import { useExerciseDetails } from './hooks/useExerciseDetails'
import { useExerciseHistory } from './hooks/useExerciseHistory'
import { useWorkoutLogger } from './hooks/useWorkoutLogger'
import { SessionExerciseCard, isPrehabSlot } from './SessionExerciseCard'
import { coachPhaseStatus, weekWithinPhase, weekdayName, planDayIndexForDate } from './planProgress'
import { PhaseAdvanceBanner } from './PhaseAdvanceBanner'
import { WarmupStretchCard } from './WarmupStretchCard'
import { useSessionPrep } from './hooks/useSessionPrep'
import { routineForDay } from '../../lib/constants/warmupStretch'
import { injuryTextToTags } from './injuryTags'
import { estimateStrengthCalories, type LoggedExerciseForKcal } from './strengthCalories'
import { useBodyweightKg } from '../weight/hooks/useBodyweightKg'
import { Term } from '../../components/ui/Term'

const pad = (n: number) => String(n).padStart(2, '0')
// Local-timezone calendar date — matches useWorkoutLogger (never UTC toISOString).
const fmtISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Rich session view on the new plan_data shape: expandable cards with demo
// image + coach cues, per-set logging (weight × reps) into workout/exercise
// logs, a ProgressEngine recommendation per exercise, and in-session swaps to
// any of the slot's alternatives (recorded on the log, never mutating the plan).
//
// Sessions are pinned to the user's real training weekdays (preferred_days), so
// "today" is honest and rest days are rest days. A day picker lets a missed or
// rearranged session be logged against the RIGHT date and plan day.
export function TodayWorkout() {
  const { activePlan, assessment, reload } = useProfile()
  const plan = activePlan?.plan_data ?? null
  const phaseStatus = coachPhaseStatus(activePlan)
  const preferredDays = assessment?.responses.availability.preferred_days ?? null
  const { usesWeekdaySchedule } = useTodayWorkout(plan, activePlan?.start_date ?? null, preferredDays)

  const todayISO = fmtISO(new Date())
  const [selectedDate, setSelectedDate] = useState(todayISO)
  // When viewing a rest day, the user can choose a session to "train anyway".
  const [trainAnywayIndex, setTrainAnywayIndex] = useState<number | null>(null)

  const dayCount = plan?.days?.length ?? 0

  // Elapsed-day cycling — only used when preferred_days is empty (fallback mode).
  const cyclingIndex = (d: Date): number => {
    if (!activePlan?.start_date || dayCount === 0) return 0
    const start = new Date(activePlan.start_date)
    start.setHours(0, 0, 0, 0)
    const dd = new Date(d)
    dd.setHours(0, 0, 0, 0)
    const diff = Math.max(0, Math.floor((dd.getTime() - start.getTime()) / 86400000))
    return diff % dayCount
  }

  // Plan-day index for a date, or null on a rest day (weekday mode only).
  const resolveIndex = (d: Date): number | null => {
    if (dayCount === 0) return null
    return usesWeekdaySchedule ? planDayIndexForDate(d, preferredDays, dayCount) : cyclingIndex(d)
  }

  const selDateObj = parseISO(selectedDate)
  const baseIndex = resolveIndex(selDateObj)
  const isRestDay = usesWeekdaySchedule && baseIndex === null
  const effectiveIndex = trainAnywayIndex ?? baseIndex
  const dayPlan = effectiveIndex != null && dayCount > 0 ? plan!.days[effectiveIndex] : null
  const trainingAnyway = isRestDay && trainAnywayIndex != null

  // Fetch details + history for the day's exercises AND their swap targets so a
  // swap renders instantly. (empty ids → hooks no-op.)
  const ids = dayPlan ? dayPlan.exercises.flatMap((e) => [e.ref.id, ...e.alternatives.map((a) => a.id)]) : []
  const { details } = useExerciseDetails(ids)
  const { history } = useExerciseHistory(ids)
  const logger = useWorkoutLogger(activePlan?.id ?? null, dayPlan?.label ?? '', selectedDate)
  const prep = useSessionPrep(selectedDate, dayPlan?.label ?? '')
  const routine = dayPlan ? routineForDay(dayPlan.label) : null
  const bodyweightKg = useBodyweightKg()
  const [summary, setSummary] = useState<{ duration: number; duration_min: number | null; totalVolume: number; exerciseCount: number; calories: number | null; persisted: boolean } | null>(null)
  // Editable duration on the summary card, prefilled from the seeded duration_min
  // (blank when null so the user types the real value). String state so an empty
  // field is legal mid-edit.
  const [durationInput, setDurationInput] = useState('')
  const [prehabConfirm, setPrehabConfirm] = useState(false)

  const isDeloadDay = dayPlan ? /deload/i.test(dayPlan.label) : false
  const hasUsablePlan = dayCount > 0

  const selectDate = (iso: string) => {
    setSelectedDate(iso)
    setTrainAnywayIndex(null)
    setSummary(null)
    setDurationInput('')
  }

  if (!activePlan) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">No active plan. Complete your assessment first.</p>
      </div>
    )
  }

  if (!hasUsablePlan) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-1 px-6 text-center">
        <p className="text-sm text-slate-300">No active plan for this format.</p>
        <p className="text-xs text-slate-500">Regenerate your plan from Profile → Reset &amp; Regenerate Plan.</p>
      </div>
    )
  }

  const prehabSlots = dayPlan?.exercises.filter(isPrehabSlot) ?? []
  // B16 — after a swap the log lives under the swapped exercise_id, not the
  // plan's ref.id. Reading by ref.id made the prehab-not-logged modal fire
  // forever after any swap; the user's only escape was "Finish anyway".
  const skippedPrehab = prehabSlots.filter((s) => {
    const effectiveId = logger.swapMap[s.ref.id] ?? s.ref.id
    const logged = logger.loggedExercises[effectiveId]
    return !logged || logged.length === 0
  })
  const skippedPrehabNames = skippedPrehab.map((s) => {
    const effectiveId = logger.swapMap[s.ref.id] ?? s.ref.id
    return details[effectiveId]?.name ?? details[s.ref.id]?.name ?? s.ref.id
  })

  const injuryTags = injuryTextToTags(assessment?.responses.preferences.injuries ?? '')

  const handleFinish = async (forceSkip?: boolean) => {
    if (!forceSkip && skippedPrehab.length > 0) {
      setPrehabConfirm(true)
      return
    }
    // Plan-modeled strength calorie estimate (display-only). Rest comes from the
    // plan slot for each logged (possibly swapped) exercise; movement pattern from
    // the library detail decides the compound/isolation MET tier.
    const slotByActiveId: Record<string, { rest_s: number; rir: number }> = {}
    for (const slot of dayPlan?.exercises ?? []) {
      const activeId = logger.swapMap[slot.ref.id] ?? slot.ref.id
      slotByActiveId[activeId] = { rest_s: slot.rest_s, rir: slot.rir }
    }
    const kcalExercises: LoggedExerciseForKcal[] = Object.entries(logger.loggedExercises)
      .filter(([, sets]) => sets.length > 0)
      .map(([exerciseId, sets]) => ({
        sets,
        movementPattern: details[exerciseId]?.movement_pattern ?? null,
        equipment: details[exerciseId]?.equipment ?? [],
        restSeconds: slotByActiveId[exerciseId]?.rest_s ?? null,
        targetRir: slotByActiveId[exerciseId]?.rir ?? null,
      }))
    const calories = estimateStrengthCalories({
      exercises: kcalExercises,
      bodyweightKg,
      warmupDone: prep.done.warmup.size > 0,
    })

    const r = await logger.finishWorkout({ prehabSkipped: skippedPrehab.length > 0, calories })
    if (r) {
      setSummary(r)
      setDurationInput(r.duration_min != null ? String(r.duration_min) : '')
    }
    setPrehabConfirm(false)
  }

  // ─── Day picker: last 7 days, so a missed/rearranged session is logged on the
  //     right date and against the right plan day. Rest days are marked. ───
  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (6 - i)) // oldest → today
    return d
  })

  const dayPicker = (
    <div className="rounded-2xl bg-card p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <CalendarDays size={14} className="text-slate-400" />
        <p className="text-[11px] font-medium text-slate-400">Log a different day</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {recentDays.map((d) => {
          const iso = fmtISO(d)
          const isSel = iso === selectedDate
          const isTraining = usesWeekdaySchedule ? resolveIndex(d) !== null : true
          return (
            <button
              key={iso}
              type="button"
              onClick={() => selectDate(iso)}
              className={`flex min-h-[52px] w-11 shrink-0 flex-col items-center justify-center rounded-lg text-center ${
                isSel ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300 active:bg-white/10'
              }`}
            >
              <span className="text-[10px] uppercase opacity-70">{weekdayName(d).slice(0, 3)}</span>
              <span className="text-sm font-bold leading-tight">{d.getDate()}</span>
              <span className={`mt-0.5 h-1 w-1 rounded-full ${isTraining ? (isSel ? 'bg-white' : 'bg-emerald-400') : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>
    </div>
  )

  const loggingLabel = selectedDate === todayISO ? 'Today' : `${weekdayName(selDateObj).slice(0, 3)} ${selDateObj.getDate()}`

  return (
    <div className="space-y-4 pb-28">
      {phaseStatus.phaseEnded && <PhaseAdvanceBanner status={phaseStatus} phase={activePlan.phase} onAdvanced={reload} />}

      {dayPicker}

      {/* ─── Rest day (nothing scheduled for the selected date) ─── */}
      {!dayPlan ? (
        <div className="rounded-2xl bg-card p-6 text-center">
          <Moon size={28} className="mx-auto text-indigo-400" />
          <h2 className="mt-2 text-lg font-bold text-white">Rest Day</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {loggingLabel === 'Today' ? "Today isn't a training day." : `${loggingLabel} isn't a training day.`} Recovery is
            where the work you already did turns into progress — sleep, eat, and come back strong.
          </p>
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-medium text-slate-400">Want to train anyway? Pick a session:</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {plan!.days.map((d, i) => (
                <button
                  key={`${d.label}-${i}`}
                  type="button"
                  onClick={() => setTrainAnywayIndex(i)}
                  className="min-h-[36px] rounded-lg bg-white/5 px-3 text-[11px] font-medium text-slate-200 active:bg-white/10"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-card p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-400">
              {activePlan.plan_name} · Phase {activePlan.phase} of {activePlan.total_phases} · Week{' '}
              {weekWithinPhase(activePlan.start_date, activePlan.phase_weeks)}
              {activePlan.phase_weeks ? ` of ${activePlan.phase_weeks}` : ''}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white">{dayPlan.label}</h2>
              {isDeloadDay && (
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                  <Term term="deload" className="decoration-amber-400/60">deload</Term>
                </span>
              )}
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">Logging: {loggingLabel}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {trainingAnyway
                ? 'Extra session on a rest day — nice.'
                : `${dayPlan.exercises.length} exercises · tap any exercise for the demo, cues & logging`}
            </p>
          </div>

          {routine && (
            <WarmupStretchCard kind="warmup" items={routine.warmup} done={prep.done.warmup} onToggle={prep.toggle} />
          )}

          <div className="space-y-2">
            {dayPlan.exercises.map((slot, i) => (
              <SessionExerciseCard
                key={`${slot.ref.id}-${i}`}
                slot={slot}
                orderIndex={i}
                details={details}
                history={history}
                isDeloadDay={isDeloadDay}
                loggedByExercise={logger.loggedExercises}
                swapMap={logger.swapMap}
                injuryTags={injuryTags}
                onSave={logger.saveExerciseSets}
              />
            ))}
          </div>

          {routine && (
            <WarmupStretchCard kind="cooldown" items={routine.cooldown} done={prep.done.cooldown} onToggle={prep.toggle} />
          )}

          {summary ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <CheckCircle2 size={22} className="mx-auto text-emerald-400" />
              <p className="mt-1 text-sm font-semibold text-white">Workout complete</p>
              <p className="mt-0.5 text-xs text-slate-300">
                {summary.exerciseCount} exercises · {Math.round(summary.totalVolume).toLocaleString()} kg <Term term="total volume">total volume</Term>
                {durationInput.trim() !== '' ? ` · ${durationInput.trim()} min` : ''}
              </p>
              {/* Truthful, user-editable duration — the timestamp delta is unreliable
                  (started_at = first save, completed_at = finish), so the user sets
                  the real value here. Persists to duration_min; never affects calories. */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <label htmlFor="workout-duration" className="text-xs text-slate-400">Duration</label>
                <input
                  id="workout-duration"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={600}
                  value={durationInput}
                  placeholder="—"
                  onChange={(e) => setDurationInput(e.target.value)}
                  onBlur={() => {
                    const v = durationInput.trim()
                    if (v === '') return
                    const n = Number(v)
                    if (!Number.isFinite(n)) return
                    const clamped = Math.max(0, Math.min(600, Math.round(n)))
                    setDurationInput(String(clamped))
                    void logger.updateDuration(clamped)
                  }}
                  className="h-11 w-16 rounded-lg border border-white/10 bg-white/5 text-center text-sm font-semibold text-white [appearance:textfield] focus:border-emerald-500/50 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-xs text-slate-400">min</span>
              </div>
              {summary.calories != null && (
                <>
                  <p className="mt-2 flex items-center justify-center gap-1 text-sm font-bold text-orange-400">
                    <Flame size={14} /> ~{summary.calories.toLocaleString()} kcal
                    <span className="text-[10px] font-normal text-slate-500">est</span>
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
                    Rough estimate — your calorie target already accounts for training.
                  </p>
                </>
              )}
              {!summary.persisted && (
                <p className="mt-2 text-[10px] leading-tight text-amber-400">
                  Your sets are saved, but this session is too old to mark complete. Log it within a week to record completion.
                </p>
              )}
            </div>
          ) : (
            <>
              {prehabConfirm && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">Injury-prevention moves not logged</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        You haven't logged your <Term term="prehab" className="decoration-amber-400/60">prehab</Term> ({skippedPrehabNames.join(' / ')}) — the small moves that keep your neck and shoulders healthy. They're a must for you — log them before finishing?
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPrehabConfirm(false)}
                          className="flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white active:bg-emerald-700"
                        >
                          Go back and log
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFinish(true)}
                          disabled={logger.saving}
                          className="flex min-h-[40px] items-center justify-center rounded-lg bg-white/10 px-3 text-sm text-slate-300 active:bg-white/15 disabled:opacity-50"
                        >
                          Finish anyway
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleFinish()}
                disabled={logger.saving}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
              >
                {logger.saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Finish workout
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
