// Recovery Watch — a READ-ONLY coaching advisory. It surfaces what the coach
// would flag in person (under-recovery / under-eating) and NEVER touches the
// plan, loads, or logs. Pure detection: no I/O, `nowMs` is injected so it stays
// deterministic and unit-testable.
//
// The rule it encodes (coach's own words): "two consecutive cycle-matched weeks
// with strength dropping + RIR maxed + no waist/weight movement → under-
// recovered/under-fed." Bias is deliberately CONSERVATIVE — a single bad
// session must never trip it, because a false alarm with no coach present to
// reassable them destroys trust (or triggers a panic-eat). All numeric knobs
// live in one block below so the sensitivity is legible, not buried.

import type { GoalMode, PlanData } from '../workout/planTypes'

// ─── Sensitivity knobs (conservative calibration) ───────────────────────────
const WINDOW_DAYS = 21 // look back ~3 weeks
const MIN_SESSIONS = 4 // total distinct workout days before anything can show
const MIN_SPAN_DAYS = 14 // …spanning at least two weeks
const MIN_SESSIONS_PER_LIFT = 3 // a lift needs 3+ data points to call a "trend"
const E1RM_DROP_PCT = 0.025 // >2.5% est-1RM net drop counts as "declining"
const RIR_MAJORITY = 0.5 // >half of a lift's rir-logged sets at/below target
const WEIGHT_FLAT_WEEKLY_KG = -0.2 // losing slower than 0.2 kg/wk on the 28-day MA = "flat"
const WAIST_SHRINK_CM = 0.5 // waist down >0.5 cm = real progress → vetoes "flat"
const SLEEP_LOW_H = 6 // avg nightly sleep below this = contributing note

const DAY_MS = 86_400_000

// ─── Inputs (all client-side, already-fetched data) ─────────────────────────
export interface RecoverySet {
  weight_kg: number
  reps: number
  rir?: number | null
}

/** One exercise's sets from one logged session. */
export interface RecoveryExerciseSession {
  /** library_exercise_id — how we match a log to its plan target. May be null
   *  for ad-hoc/custom entries (those just can't be RIR-evaluated). */
  libraryId: string | null
  exerciseId: string
  name: string
  date: string // workout_date, ISO yyyy-mm-dd
  sets: RecoverySet[]
}

export interface RecoveryBodyInput {
  /** Latest `weight_trend.ma_28d` and a sample ~2 weeks earlier — the cycle-
   *  smoothed signal the coach trusts for Person B. */
  ma28dLatest: number | null
  ma28dLatestDate: string | null
  ma28dPrior: number | null
  ma28dPriorDate: string | null
  /** Most-recent and ~2-week-prior waist tape (cm), when logged. */
  waistRecent: number | null
  waistPrior: number | null
}

export interface RecoveryInput {
  goalMode: GoalMode
  plan: PlanData | null
  sessions: RecoveryExerciseSession[]
  body: RecoveryBodyInput
  sleepAvg: number | null
  nowMs: number
}

// ─── Output ─────────────────────────────────────────────────────────────────
export type RecoveryStatus = 'ok' | 'watch' | 'under_recovered'

export interface RecoveryEvidence {
  strengthDown: boolean
  rirMaxed: boolean
  /** null = not applicable (only Person B / cut uses the body signal). */
  bodyFlat: boolean | null
  sleepLow: boolean
  decliningLifts: { name: string; dropPct: number }[]
  sleepAvg: number | null
  /** Human-readable chips shown on the card so it's legible, not a black box. */
  notes: string[]
}

export interface RecoveryResult {
  status: RecoveryStatus
  title: string
  body: string
  evidence: RecoveryEvidence
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function dateMs(iso: string): number {
  const t = Date.parse(iso.length <= 10 ? `${iso}T00:00:00Z` : iso)
  return Number.isNaN(t) ? 0 : t
}

// Epley estimated 1RM of the best set — the same single comparable number
// LiftProgress.tsx uses. Sets with no external load (ladders/bodyweight/core)
// yield 0 and are ignored here; their progress shows on the session card.
function bestE1RM(sets: RecoverySet[]): number {
  let best = 0
  for (const s of sets) {
    const v = (s.weight_kg || 0) * (1 + (s.reps || 0) / 30)
    if (v > best) best = v
  }
  return best
}

interface PlanTarget {
  rir: number
  repLow: number
}

function planTargetFor(plan: PlanData | null, libraryId: string | null): PlanTarget | null {
  if (!plan || !libraryId) return null
  for (const day of plan.days) {
    for (const ex of day.exercises) {
      if (ex.ref.type === 'library' && ex.ref.id === libraryId) {
        return { rir: ex.rir, repLow: ex.rep_low }
      }
    }
  }
  return null
}

// ─── Detection ────────────────────────────────────────────────────────────────
export function detectRecovery(input: RecoveryInput): RecoveryResult {
  const { goalMode, plan, sessions, body, sleepAvg, nowMs } = input
  const windowStart = nowMs - WINDOW_DAYS * DAY_MS

  const inWindow = sessions.filter((s) => dateMs(s.date) >= windowStart)

  const emptyEvidence = (): RecoveryEvidence => ({
    strengthDown: false,
    rirMaxed: false,
    bodyFlat: goalMode === 'cut' ? false : null,
    sleepLow: sleepAvg != null && sleepAvg < SLEEP_LOW_H,
    decliningLifts: [],
    sleepAvg,
    notes: [],
  })

  // ── Data-sufficiency gate: nothing shows without 2+ weeks of real data ──
  const dates = new Set(inWindow.map((s) => s.date))
  if (dates.size < MIN_SESSIONS) {
    return { status: 'ok', title: '', body: '', evidence: emptyEvidence() }
  }
  const dayMsList = [...dates].map(dateMs)
  const spanDays = (Math.max(...dayMsList) - Math.min(...dayMsList)) / DAY_MS
  if (spanDays < MIN_SPAN_DAYS) {
    return { status: 'ok', title: '', body: '', evidence: emptyEvidence() }
  }

  // ── (a) Strength trend: per weighted lift, is est-1RM sustainably declining? ──
  const byLift = new Map<string, RecoveryExerciseSession[]>()
  for (const s of inWindow) {
    const key = s.libraryId ?? s.exerciseId
    const arr = byLift.get(key) ?? []
    arr.push(s)
    byLift.set(key, arr)
  }

  const decliningLifts: { name: string; dropPct: number }[] = []
  let rirMaxed = false

  for (const [, group] of byLift) {
    const points = group
      .map((g) => ({ date: g.date, e1rm: bestE1RM(g.sets), sets: g.sets, name: g.name, libraryId: g.libraryId }))
      .filter((p) => p.e1rm > 0)
      .sort((a, b) => dateMs(a.date) - dateMs(b.date))

    if (points.length < MIN_SESSIONS_PER_LIFT) continue

    const first = points[0].e1rm
    const last = points[points.length - 1].e1rm
    const prev = points[points.length - 2].e1rm
    const dropPct = (first - last) / first

    // Declining = net drop past the noise floor AND still falling at the end
    // (so one mid-window dip that already rebounded does NOT count).
    const declining = dropPct > E1RM_DROP_PCT && last <= prev
    if (!declining) continue

    decliningLifts.push({ name: points[0].name, dropPct })

    // (b) RIR drift on the declining lift: are most rir-logged sets at/below
    //     the plan's target RIR AND missing the target rep_low? Needs a plan
    //     target to compare against; ad-hoc/untargeted lifts are skipped.
    const target = planTargetFor(plan, points[0].libraryId)
    if (target) {
      let rated = 0
      let maxed = 0
      for (const p of points) {
        for (const set of p.sets) {
          if (set.rir == null) continue
          rated++
          if (set.rir <= target.rir && (set.reps || 0) < target.repLow) maxed++
        }
      }
      if (rated >= 2 && maxed / rated > RIR_MAJORITY) rirMaxed = true
    }
  }

  const strengthDown = decliningLifts.length > 0

  // ── (c) Body signal — Person B (cut) only ──
  let bodyFlat: boolean | null = null
  if (goalMode === 'cut') {
    let weightFlat: boolean | null = null
    if (body.ma28dLatest != null && body.ma28dPrior != null && body.ma28dLatestDate && body.ma28dPriorDate) {
      const weeks = (dateMs(body.ma28dLatestDate) - dateMs(body.ma28dPriorDate)) / (7 * DAY_MS)
      if (weeks > 0) {
        const weeklyChange = (body.ma28dLatest - body.ma28dPrior) / weeks
        weightFlat = weeklyChange > WEIGHT_FLAT_WEEKLY_KG // losing slower than the floor = flat
      }
    }
    // Waist actively shrinking = real progress and vetoes the flag; missing
    // waist data is treated as "unknown" (doesn't veto). Conservative: we only
    // assert body-flat when weight is CONFIRMED flat.
    const waistShrinking =
      body.waistRecent != null && body.waistPrior != null && body.waistPrior - body.waistRecent > WAIST_SHRINK_CM
    bodyFlat = weightFlat === true && !waistShrinking
  }

  const sleepLow = sleepAvg != null && sleepAvg < SLEEP_LOW_H

  // ── Combine into a status (one-signal = watch) ──
  const required = goalMode === 'cut' ? [strengthDown, rirMaxed, bodyFlat === true] : [strengthDown, rirMaxed]
  const allRequired = required.every(Boolean)
  const presentCount = required.filter(Boolean).length

  let status: RecoveryStatus
  if (allRequired) status = 'under_recovered'
  else if (presentCount >= 1 || sleepLow) status = 'watch'
  else status = 'ok'

  // ── Evidence chips (shown verbatim on the card) ──
  const notes: string[] = []
  if (strengthDown) {
    const top = decliningLifts.slice().sort((a, b) => b.dropPct - a.dropPct)[0]
    notes.push(`strength ↓ ${(top.dropPct * 100).toFixed(0)}% (${top.name})`)
  }
  if (rirMaxed) notes.push('hitting failure on most sets (no reps left in the tank)')
  if (bodyFlat === true) notes.push('weight & waist not moving (4-week average)')
  if (sleepLow && sleepAvg != null) notes.push(`sleep ~${sleepAvg.toFixed(1)}h a night`)

  const evidence: RecoveryEvidence = {
    strengthDown,
    rirMaxed,
    bodyFlat,
    sleepLow,
    decliningLifts,
    sleepAvg,
    notes,
  }

  if (status === 'ok') return { status, title: '', body: '', evidence }

  const { title, body: msg } = buildMessage(status, goalMode, evidence)
  return { status, title, body: msg, evidence }
}

// ─── Messaging — encouraging, non-alarming, goal-aware ───────────────────────
function buildMessage(
  status: RecoveryStatus,
  goalMode: GoalMode,
  ev: RecoveryEvidence,
): { title: string; body: string } {
  const isCut = goalMode === 'cut'
  // For B (cut) the lever is a refeed; for A (recomp) it's sleep + volume.
  const fix = isCut
    ? 'eat a bit more for a day (up to your maintenance calories) and get an extra hour of sleep, then drop one set on the lifts you’re struggling with'
    : 'get an extra hour of sleep and drop one set on the lifts you’re struggling with'

  if (status === 'under_recovered') {
    return {
      title: 'Heads up — you may need more recovery',
      body:
        `Your strength has stalled and you’ve been pushing every set to the limit` +
        (ev.sleepLow ? ' on short sleep' : '') +
        `${isCut ? ' while your weight and waist aren’t moving' : ''}. ` +
        `This almost always means you’re not recovering enough (or not eating enough) — not that you aren’t trying hard. ` +
        `Best move: ${fix}. Don’t push harder this week — this is your body asking to recover.`,
    }
  }

  // watch — soft note
  return {
    title: 'Just keeping an eye on recovery',
    body:
      `One early signal is showing up${ev.sleepLow ? ' (including short sleep)' : ''}. ` +
      `Nothing alarming yet — keep logging. If it holds another week, ${fix}.`,
  }
}
