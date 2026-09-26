import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ChevronDown, Clock, Dumbbell, Minus, RefreshCw, SquarePlay } from 'lucide-react'
import type { ExerciseSet, PlanExerciseEntry, PlanOverloadRules } from '../../lib/types'
import type { PlanSlotExercise } from './planTypes'
import { getRecommendation, setComparison } from './ProgressEngine'
import type { ExerciseCues, ExerciseDetail } from './hooks/useExerciseDetails'
import type { ExerciseHistory } from './hooks/useExerciseHistory'
import { ExerciseMedia } from './ExerciseMedia'

/** Best available YouTube link: the exact video, the seeded search, else a name-based search. */
function youtubeUrl(name: string, detail?: ExerciseDetail): string {
  if (detail?.youtube_id) return `https://www.youtube.com/watch?v=${detail.youtube_id}`
  if (detail?.youtube_search_url) return detail.youtube_search_url
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise form technique`)}`
}

// getRecommendation ignores overloadRules (kept for signature compat).
const NO_OVERLOAD: PlanOverloadRules = {
  linearProgression: '',
  doubleProgression: '',
  failureProtocol: '',
  deloadProtocol: '',
}

const SWAP_REASONS = [
  { value: 'preference', label: 'Preference' },
  { value: 'injury', label: 'Injury / pain' },
  { value: 'equipment_busy', label: 'Equipment busy' },
  { value: 'too_hard', label: 'Too hard' },
]

const PATTERN_LABEL: Record<string, string> = {
  push: 'Push', pull: 'Pull', hinge: 'Hinge', squat: 'Squat', carry: 'Carry', isolation: 'Isolation',
  horizontal_press: 'Horiz. press', vertical_press: 'Vert. press',
  horizontal_pull: 'Horiz. pull', vertical_pull: 'Vert. pull',
  hip_hinge: 'Hip hinge', lateral_raise: 'Lateral raise',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'bg-emerald-500/15 text-emerald-400',
  intermediate: 'bg-amber-500/15 text-amber-400',
  advanced: 'bg-red-500/15 text-red-400',
}

// incline-push-up ladder: higher surface = easier. Progress = value DROPPING.
const SURFACE_LEVELS = [
  { value: 5, label: 'Wall' },
  { value: 4, label: 'High bar / Smith' },
  { value: 3, label: 'Bench' },
  { value: 2, label: 'Low box' },
  { value: 1, label: 'Floor' },
]
const surfaceLabel = (v?: number | null) =>
  v == null ? '—' : SURFACE_LEVELS.find((s) => s.value === v)?.label ?? `L${v}`

const prettyMuscle = (m: string) => m.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

/** A plan slot is prehab if its ref.id is a known prehab exercise OR its coach
 *  note contains "prehab" (case-insensitive). Derived from plan_data only. */
export function isPrehabSlot(slot: PlanSlotExercise): boolean {
  const PREHAB_IDS = ['face-pulls', 'reverse-flyes']
  if (PREHAB_IDS.includes(slot.ref.id)) return true
  if (slot.note && /prehab/i.test(slot.note)) return true
  return false
}

interface Props {
  slot: PlanSlotExercise
  orderIndex: number
  details: Record<string, ExerciseDetail>
  history: Record<string, ExerciseHistory>
  isDeloadDay: boolean
  /** Sets already logged this session, keyed by the exercise id. */
  loggedByExercise: Record<string, ExerciseSet[]>
  /** Maps original plan ref.id → swapped-to exercise_id from today's DB log. */
  swapMap: Record<string, string>
  onSave: (
    exerciseId: string,
    exerciseName: string,
    sets: ExerciseSet[],
    orderIndex: number,
    opts?: { swappedFromRef?: string; swapReason?: string },
  ) => void
}

type Row = { weight: string; reps: string; rir: string; assist: string; surface: string }

export function SessionExerciseCard({ slot, orderIndex, details, history, isDeloadDay, loggedByExercise, swapMap, onSave }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [activeId, setActiveId] = useState(() => swapMap[slot.ref.id] ?? slot.ref.id)
  const [showSwap, setShowSwap] = useState(false)
  const [swapReason, setSwapReason] = useState('preference')

  // When swapMap hydrates from DB after mount, update activeId to the swapped exercise.
  useEffect(() => {
    const mapped = swapMap[slot.ref.id]
    if (mapped && activeId === slot.ref.id) setActiveId(mapped)
  }, [swapMap, slot.ref.id, activeId])

  const swapped = activeId !== slot.ref.id
  const isPrehab = isPrehabSlot(slot)
  const detail = details[activeId]
  const name = detail?.name ?? activeId
  const lastSession = history[activeId]
  const alreadyLogged = loggedByExercise[activeId]

  const repRange = slot.rep_low === slot.rep_high ? `${slot.rep_low}` : `${slot.rep_low}–${slot.rep_high}`

  // assist_reduction = Person B's ladder. 'assist' = machine/band kg (assisted-
  // pull-up); 'surface' = incline height (incline-push-up). Either way the win
  // is the number FALLING, so this branch never logs into weight_kg.
  const isLadder = slot.progression === 'assist_reduction'
  const ladderMode: 'assist' | 'surface' =
    detail?.equipment?.some((e) => e === 'assisted-pull-up-machine' || e === 'resistance-band') || activeId.includes('assisted')
      ? 'assist'
      : 'surface'

  const planEntry: PlanExerciseEntry = useMemo(
    () => ({
      exerciseId: activeId,
      targetSets: slot.sets,
      targetRepsMin: slot.rep_low,
      targetRepsMax: slot.rep_high,
      targetRir: slot.rir,
      restSeconds: slot.rest_s,
      progressionRule: slot.progression,
      notes: slot.note ?? '',
      alternatives: slot.alternatives.map((a) => a.id),
    }),
    [activeId, slot],
  )

  const rec = useMemo(
    () => getRecommendation(planEntry, lastSession ? [{ date: lastSession.workout_date, sets: lastSession.sets }] : [], NO_OVERLOAD, isDeloadDay),
    [planEntry, lastSession, isDeloadDay],
  )

  const buildRows = (): Row[] => {
    const logged = loggedByExercise[activeId]
    return Array.from({ length: slot.sets }, (_, i) => {
      const s = logged?.[i]
      return s
        ? {
            weight: String(s.weight_kg),
            reps: String(s.reps),
            rir: s.rir != null ? String(s.rir) : String(slot.rir),
            assist: s.assist_kg != null ? String(s.assist_kg) : '',
            surface: s.surface_level != null ? String(s.surface_level) : '',
          }
        : { weight: '', reps: '', rir: String(slot.rir), assist: '', surface: '' }
    })
  }
  const [rows, setRows] = useState<Row[]>(buildRows)
  // Reset the working rows when the exercise is swapped (or logged sets arrive).
  useEffect(() => {
    setRows(buildRows())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, alreadyLogged])

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const prefill = () =>
    setRows((rs) =>
      rs.map((r) => {
        if (isLadder) {
          if (r.assist || r.surface || r.reps) return r
          // carry last session's ladder value forward as the starting point (she
          // aims to go LOWER than this), plus the target reps.
          const last = lastSession?.sets?.[0]
          return {
            ...r,
            reps: String(rec.recommendedReps),
            assist: ladderMode === 'assist' && last?.assist_kg != null ? String(last.assist_kg) : r.assist,
            surface: ladderMode === 'surface' && last?.surface_level != null ? String(last.surface_level) : r.surface,
          }
        }
        return r.weight || r.reps ? r : { ...r, weight: rec.recommendedWeight ? String(rec.recommendedWeight) : '', reps: String(rec.recommendedReps) }
      }),
    )

  const save = () => {
    const parsed: ExerciseSet[] = rows
      .map((r, i) => {
        const base = {
          set_number: i + 1,
          reps: Number(r.reps) || 0,
          rir: r.rir !== '' && !Number.isNaN(Number(r.rir)) ? Number(r.rir) : slot.rir,
        }
        if (isLadder && ladderMode === 'assist') return { ...base, weight_kg: 0, assist_kg: Number(r.assist) || 0 }
        if (isLadder && ladderMode === 'surface') return { ...base, weight_kg: 0, surface_level: r.surface ? Number(r.surface) : undefined }
        return { ...base, weight_kg: Number(r.weight) || 0 }
      })
      .filter((s) => s.reps > 0)
    if (parsed.length === 0) return
    onSave(activeId, name, parsed, orderIndex, swapped ? { swappedFromRef: slot.ref.id, swapReason } : undefined)
  }

  const options = [slot.ref, ...slot.alternatives]
  const contra = detail?.contraindications ?? []
  const cues = detail?.cues ?? {}
  const savedCount = alreadyLogged?.length ?? 0

  return (
    <div className="overflow-hidden rounded-xl bg-card">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-start gap-2 px-3 py-3 text-left active:bg-white/5"
      >
        <Dumbbell size={16} className="mt-0.5 shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            {isPrehab && <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">prehab</span>}
            {swapped && <span className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-400">swapped</span>}
            {savedCount > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                <Check size={10} /> {savedCount}
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            {slot.sets} × {repRange} · RIR {slot.rir}
            <span className="mx-1 text-slate-700">·</span>
            <Clock size={11} /> {slot.rest_s}s
          </p>
        </div>
        <ChevronDown size={16} className={`mt-1 shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-white/5 px-3 pb-4 pt-3">
          {detail?.gif_url && (
            <figure>
              <ExerciseMedia src={detail.gif_url} alt={name} className="max-h-64 w-full rounded-lg bg-black/20 object-contain" />
              {detail.media_attribution && <figcaption className="mt-1 text-[10px] text-slate-600">Demo image: {detail.media_attribution}</figcaption>}
            </figure>
          )}

          <a
            href={youtubeUrl(name, detail)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20"
          >
            <SquarePlay size={16} /> Watch on YouTube
          </a>

          <div className="flex flex-wrap items-center gap-1.5">
            {detail && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLOR[detail.difficulty] ?? 'bg-slate-500/15 text-slate-300'}`}>
                {detail.difficulty}
              </span>
            )}
            {detail && (
              <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-400">
                {PATTERN_LABEL[detail.movement_pattern] ?? detail.movement_pattern}
              </span>
            )}
            {detail && <span className="text-[11px] text-slate-400">{[detail.primary_muscle, ...detail.secondary_muscles].map(prettyMuscle).join(' · ')}</span>}
          </div>

          {slot.note && <p className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] italic text-slate-300">Coach: {slot.note}</p>}

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-400">Recommendation{isDeloadDay ? ' · deload' : ''}</p>
            <p className="mt-0.5 text-xs text-slate-200">{rec.reason}</p>
            {lastSession && (
              <p className="mt-0.5 text-[10px] text-slate-500">
                Last ({lastSession.workout_date}):{' '}
                {lastSession.sets
                  .map((s) =>
                    isLadder && ladderMode === 'assist'
                      ? `${s.assist_kg ?? 0}kg-assist×${s.reps}`
                      : isLadder && ladderMode === 'surface'
                        ? `${surfaceLabel(s.surface_level)}×${s.reps}`
                        : `${s.weight_kg}kg×${s.reps}`,
                  )
                  .join(', ')}
              </p>
            )}
          </div>

          {contra.length > 0 && (
            <p className="rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-400">
              Caution ({contra.map(prettyMuscle).join(', ')}) — ease off if it aggravates the area.
            </p>
          )}

          <CueBlock cues={cues} />

          {/* ── Set logging ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Log your sets ·{' '}
                <span className="text-slate-500">
                  {isLadder && ladderMode === 'assist'
                    ? 'assist-kg × reps @ RIR'
                    : isLadder && ladderMode === 'surface'
                      ? 'surface × reps @ RIR'
                      : 'kg × reps @ RIR'}{' '}
                  (target RIR {slot.rir})
                </span>
              </p>
              <button type="button" onClick={prefill} className="text-[11px] text-emerald-400 active:text-emerald-300">Prefill</button>
            </div>

            {isLadder && (
              <p className="rounded-lg bg-sky-500/10 px-2.5 py-1.5 text-[11px] text-sky-300">
                {ladderMode === 'assist'
                  ? 'Ladder — the win is your ASSISTANCE dropping week to week (less help = stronger), not more reps. 0 = unassisted.'
                  : 'Ladder — the win is LOWERING the surface toward the floor (Wall → … → Floor), not more reps.'}
              </p>
            )}

            {rows.map((r, i) => {
              const cmp = !isLadder && lastSession && r.reps && r.weight
                ? setComparison({ set_number: i + 1, weight_kg: Number(r.weight) || 0, reps: Number(r.reps) || 0 }, lastSession.sets)
                : null
              // ladder: falling value = progress (green ↓), rising = regress (amber ↑)
              let ladder: 'progress' | 'regress' | 'same' | null = null
              if (isLadder) {
                const lastSet = lastSession?.sets.find((s) => s.set_number === i + 1) ?? lastSession?.sets[i]
                const cur = ladderMode === 'assist' ? (r.assist !== '' ? Number(r.assist) : null) : (r.surface !== '' ? Number(r.surface) : null)
                const prev = ladderMode === 'assist' ? lastSet?.assist_kg : lastSet?.surface_level
                if (cur != null && prev != null) ladder = cur < prev ? 'progress' : cur > prev ? 'regress' : 'same'
              }
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-3 shrink-0 text-center text-[11px] text-slate-500">{i + 1}</span>
                  {isLadder && ladderMode === 'surface' ? (
                    <select
                      value={r.surface}
                      onChange={(e) => setRow(i, { surface: e.target.value })}
                      className="min-h-[40px] w-full min-w-0 flex-1 rounded-lg bg-white/5 px-1 text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      aria-label={`Set ${i + 1} surface`}
                    >
                      <option value="" className="bg-slate-800">surface</option>
                      {SURFACE_LEVELS.map((s) => (
                        <option key={s.value} value={s.value} className="bg-slate-800">{s.label}</option>
                      ))}
                    </select>
                  ) : isLadder && ladderMode === 'assist' ? (
                    <input
                      inputMode="decimal"
                      value={r.assist}
                      onChange={(e) => setRow(i, { assist: e.target.value })}
                      placeholder="assist kg"
                      className="min-h-[40px] w-full min-w-0 flex-1 rounded-lg bg-white/5 px-2 text-center text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      aria-label={`Set ${i + 1} assistance (kg)`}
                    />
                  ) : (
                    <input
                      inputMode="decimal"
                      value={r.weight}
                      onChange={(e) => setRow(i, { weight: e.target.value })}
                      placeholder={rec.recommendedWeight ? `${rec.recommendedWeight}` : 'kg'}
                      className="min-h-[40px] w-full min-w-0 flex-1 rounded-lg bg-white/5 px-2 text-center text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      aria-label={`Set ${i + 1} weight (kg)`}
                    />
                  )}
                  <span className="shrink-0 text-xs text-slate-600">×</span>
                  <input
                    inputMode="numeric"
                    value={r.reps}
                    onChange={(e) => setRow(i, { reps: e.target.value })}
                    placeholder={`${rec.recommendedReps}`}
                    className="min-h-[40px] w-full min-w-0 flex-1 rounded-lg bg-white/5 px-2 text-center text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    aria-label={`Set ${i + 1} reps`}
                  />
                  <span className="shrink-0 text-[11px] text-slate-600">@</span>
                  <input
                    inputMode="numeric"
                    value={r.rir}
                    onChange={(e) => setRow(i, { rir: e.target.value })}
                    placeholder={String(slot.rir)}
                    className="min-h-[40px] w-9 shrink-0 rounded-lg bg-white/5 px-1 text-center text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    aria-label={`Set ${i + 1} RIR`}
                  />
                  <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                    {cmp === 'up' && <ArrowUp size={13} className="text-emerald-400" />}
                    {cmp === 'down' && <ArrowDown size={13} className="text-red-400" />}
                    {cmp === 'same' && <Minus size={13} className="text-slate-500" />}
                    {ladder === 'progress' && <ArrowDown size={13} className="text-emerald-400" />}
                    {ladder === 'regress' && <ArrowUp size={13} className="text-amber-400" />}
                    {ladder === 'same' && <Minus size={13} className="text-slate-500" />}
                  </span>
                </div>
              )
            })}
            <button
              type="button"
              onClick={save}
              className="mt-1 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white active:bg-emerald-700"
            >
              <Check size={16} /> {savedCount > 0 ? 'Update sets' : 'Save sets'}
            </button>
          </div>

          {/* ── Swap ── */}
          <div className="border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={() => setShowSwap((p) => !p)}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 active:text-slate-200"
            >
              <RefreshCw size={12} /> Swap exercise
            </button>
            {showSwap && (
              <div className="mt-2 space-y-2">
                <select
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg bg-white/5 px-2 text-xs text-slate-200 focus:outline-none"
                >
                  {SWAP_REASONS.map((r) => (
                    <option key={r.value} value={r.value} className="bg-slate-800">{r.label}</option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((opt) => {
                    const isActive = opt.id === activeId
                    const isOriginal = opt.id === slot.ref.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setActiveId(opt.id)
                          setShowSwap(false)
                        }}
                        className={`min-h-[36px] rounded-lg px-2.5 text-[11px] ${
                          isActive ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300 active:bg-white/10'
                        }`}
                      >
                        {details[opt.id]?.name ?? opt.id}
                        {isOriginal && !isActive ? ' (original)' : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CueList({ label, items, color }: { label: string; items?: string[]; color: string }) {
  if (!items?.length) return null
  return (
    <div>
      <p className={`mb-0.5 text-[10px] font-medium uppercase tracking-wide ${color}`}>{label}</p>
      <ul className="space-y-0.5">
        {items.map((c, i) => (
          <li key={i} className="text-xs leading-relaxed text-slate-300">• {c}</li>
        ))}
      </ul>
    </div>
  )
}

function CueBlock({ cues }: { cues: ExerciseCues }) {
  const empty = !cues.setup?.length && !cues.execution?.length && !cues.breathing && !cues.common_mistakes?.length && !cues.ruin_your_gains?.length
  if (empty) return null
  return (
    <div className="space-y-2">
      <CueList label="Setup" items={cues.setup} color="text-slate-400" />
      <CueList label="Execution" items={cues.execution} color="text-emerald-400" />
      {cues.breathing && (
        <p className="text-xs text-slate-400"><span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Breathing: </span>{cues.breathing}</p>
      )}
      <CueList label="Common mistakes" items={cues.common_mistakes} color="text-red-400" />
      {cues.ruin_your_gains?.length ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-red-400">Don't waste the set</p>
          {cues.ruin_your_gains.map((c, i) => (
            <p key={i} className="mt-0.5 text-xs text-slate-200">{c}</p>
          ))}
        </div>
      ) : null}
    </div>
  )
}
