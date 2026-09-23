import { useState, useEffect } from 'react'
import { Scale, TrendingDown, TrendingUp, Target, Info } from 'lucide-react'
import { useWeightLogs } from './hooks/useWeightLogs'
import { useWeightTrend } from './hooks/useWeightTrend'
import { useProfile } from '../profile/ProfileContext'
import { WeightChart } from './WeightChart'
import type { AssessmentResponses } from '../profile/types'

export function WeightTracker() {
  const { logs, loading, saving, upsert } = useWeightLogs()
  const { profile, assessment } = useProfile()

  const today = new Date().toLocaleDateString('en-CA')

  const [date, setDate] = useState(today)
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [bust, setBust] = useState('')

  // Sync form fields whenever logs load or the selected date changes
  useEffect(() => {
    const log = logs.find(l => l.log_date === date)
    setWeight(log?.weight_kg?.toString() ?? '')
    setWaist(log?.waist_cm?.toString() ?? '')
    setHip(log?.hip_cm?.toString() ?? '')
    setBust(log?.bust_cm?.toString() ?? '')
  }, [date, logs])

  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const { latest: trend28 } = useWeightTrend()

  const handleSubmit = async () => {
    const w = parseFloat(weight)
    if (!w || w < 20 || w > 300) {
      setToast({ msg: 'Enter a valid weight (20–300 kg)', type: 'err' })
      return
    }
    const waistVal = waist ? parseFloat(waist) : null
    if (waistVal !== null && (waistVal < 30 || waistVal > 200)) {
      setToast({ msg: 'Enter a valid waist (30–200 cm)', type: 'err' })
      return
    }
    const hipVal = hip ? parseFloat(hip) : null
    if (hipVal !== null && (hipVal < 40 || hipVal > 220)) {
      setToast({ msg: 'Enter a valid hip (40–220 cm)', type: 'err' })
      return
    }
    const bustVal = bust ? parseFloat(bust) : null
    if (bustVal !== null && (bustVal < 40 || bustVal > 200)) {
      setToast({ msg: 'Enter a valid bust/chest (40–200 cm)', type: 'err' })
      return
    }

    const { error } = await upsert(date, w, { waist_cm: waistVal, hip_cm: hipVal, bust_cm: bustVal })
    if (error) {
      setToast({ msg: error, type: 'err' })
    } else {
      setToast({ msg: 'Weight logged!', type: 'ok' })
      setTimeout(() => setToast(null), 2000)
    }
  }

  const trendInfo = computeTrend(logs)
  const goalInfo = computeGoal(
    logs,
    profile?.current_weight_kg ?? null,
    profile?.target_weight_kg ?? null,
    (assessment?.responses as AssessmentResponses)?.goals?.primary ?? null,
  )

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-32 animate-pulse rounded-xl bg-card" />
        <div className="h-56 animate-pulse rounded-xl bg-card" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Input form */}
      <div className="rounded-xl bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Scale size={18} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Log Weight</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-[10px] text-slate-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={today}
              className="w-full rounded-lg bg-slate-800 px-2.5 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-slate-400">Weight (kg)*</label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="65.0"
              className="w-full rounded-lg bg-slate-800 px-2.5 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-slate-400">Waist (cm)</label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={waist}
              onChange={e => setWaist(e.target.value)}
              placeholder="80.0"
              className="w-full rounded-lg bg-slate-800 px-2.5 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Monthly tape — hip & bust (optional; log ~every 4 weeks) */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] text-slate-400">Hip (cm) · monthly</label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={hip}
              onChange={e => setHip(e.target.value)}
              placeholder="95.0"
              className="w-full rounded-lg bg-slate-800 px-2.5 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-slate-400">Bust/chest (cm) · monthly</label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={bust}
              onChange={e => setBust(e.target.value)}
              placeholder="90.0"
              className="w-full rounded-lg bg-slate-800 px-2.5 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !weight}
          className="mt-3 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : logs.find(l => l.log_date === date) ? 'Update Entry' : 'Log Weight'}
        </button>

        {toast && (
          <p className={`mt-2 text-center text-xs ${toast.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {toast.msg}
          </p>
        )}
      </div>

      {/* 28-day cycle-smoothed average — the number the coach says to trust */}
      {trend28?.ma_28d != null && (
        <div className="rounded-xl bg-card p-3">
          <p className="text-[10px] text-slate-400">Cycle-smoothed weight — trust this, not the daily scale</p>
          <p className="mt-0.5 text-sm font-bold text-white">
            28-day avg {Number(trend28.ma_28d).toFixed(1)} kg
            {trend28.ma_7d != null && (
              <span className="ml-2 text-[11px] font-normal text-slate-500">· 7-day {Number(trend28.ma_7d).toFixed(1)} kg</span>
            )}
          </p>
        </div>
      )}

      {/* Trend + Goal */}
      {(trendInfo || goalInfo) && (
        <div className="grid grid-cols-2 gap-3">
          {trendInfo && (
            <div className="rounded-xl bg-card p-3">
              <p className="mb-1 text-[10px] text-slate-400">4-Week Trend</p>
              <div className="flex items-center gap-1.5">
                {trendInfo.direction === 'down' ? (
                  <TrendingDown size={16} className={trendInfo.color} />
                ) : (
                  <TrendingUp size={16} className={trendInfo.color} />
                )}
                <span className={`text-sm font-bold ${trendInfo.color}`}>
                  {trendInfo.symbol} {trendInfo.delta} kg
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">over 4 weeks</p>
            </div>
          )}
          {goalInfo && (
            <div className="rounded-xl bg-card p-3">
              <p className="mb-1 text-[10px] text-slate-400">Goal Progress</p>
              <div className="flex items-center gap-1.5">
                <Target size={16} className="text-indigo-400" />
                <span className="text-sm font-bold text-white">{goalInfo.remaining} kg to go</span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">{goalInfo.detail}</p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <WeightChart logs={logs} />

      {/* Reminder */}
      <div className="flex items-start gap-2 rounded-xl bg-slate-800/50 px-3 py-2.5">
        <Info size={14} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-[11px] leading-relaxed text-slate-500">
          Log once a week, same day, first thing in the morning for consistency.
        </p>
      </div>
    </div>
  )
}

interface TrendResult {
  delta: string
  direction: 'up' | 'down'
  symbol: string
  color: string
}

function computeTrend(logs: { log_date: string; weight_kg: number }[]): TrendResult | null {
  if (logs.length < 2) return null

  const now = new Date()
  const oneWeekAgo = new Date(now)
  oneWeekAgo.setDate(now.getDate() - 10)
  const fourWeeksAgo = new Date(now)
  fourWeeksAgo.setDate(now.getDate() - 35)
  const fiveWeeksAgo = new Date(now)
  fiveWeeksAgo.setDate(now.getDate() - 42)

  const recentStr = oneWeekAgo.toISOString().slice(0, 10)
  const fourStr = fourWeeksAgo.toISOString().slice(0, 10)
  const fiveStr = fiveWeeksAgo.toISOString().slice(0, 10)

  const recentLogs = logs.filter(l => l.log_date >= recentStr)
  const olderLogs = logs.filter(l => l.log_date >= fiveStr && l.log_date < fourStr)

  if (recentLogs.length === 0 || olderLogs.length === 0) return null

  const avgRecent = recentLogs.reduce((s, l) => s + l.weight_kg, 0) / recentLogs.length
  const avgOlder = olderLogs.reduce((s, l) => s + l.weight_kg, 0) / olderLogs.length

  const diff = avgRecent - avgOlder
  const absDiff = Math.abs(Math.round(diff * 10) / 10)

  return {
    delta: absDiff.toFixed(1),
    direction: diff >= 0 ? 'up' : 'down',
    symbol: diff >= 0 ? '▲' : '▼',
    color: diff >= 0 ? 'text-emerald-400' : 'text-amber-400',
  }
}

interface GoalResult {
  remaining: string
  detail: string
}

function computeGoal(
  logs: { log_date: string; weight_kg: number }[],
  startWeight: number | null,
  targetWeight: number | null,
  _primaryGoal: string | null,
): GoalResult | null {
  if (startWeight == null || targetWeight == null) return null

  const latest = logs.length > 0 ? logs[logs.length - 1].weight_kg : startWeight
  const remaining = Math.abs(targetWeight - latest)

  if (remaining < 0.1) {
    return { remaining: '0', detail: 'Goal reached!' }
  }

  let weeksEstimate: number | null = null
  if (logs.length >= 4) {
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    const cutoff = fourWeeksAgo.toISOString().slice(0, 10)
    const olderLogs = logs.filter(l => l.log_date <= cutoff)
    if (olderLogs.length > 0) {
      const oldWeight = olderLogs[olderLogs.length - 1].weight_kg
      const weeklyRate = (latest - oldWeight) / 4

      const gaining = targetWeight > latest
      const rateInRightDirection = gaining ? weeklyRate > 0.05 : weeklyRate < -0.05

      if (rateInRightDirection) {
        weeksEstimate = Math.ceil(remaining / Math.abs(weeklyRate))
      }
    }
  }

  const detail = weeksEstimate
    ? `${Math.round(startWeight)} → ${Math.round(targetWeight)} kg (est. ~${weeksEstimate} weeks)`
    : `${Math.round(startWeight)} → ${Math.round(targetWeight)} kg`

  return { remaining: remaining.toFixed(1), detail }
}
