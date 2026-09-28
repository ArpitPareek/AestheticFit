import { useMemo, useState } from 'react'
import { Heart, Plus, Trash2, Activity, Flame, Search, Gauge } from 'lucide-react'
import { useCardioLogs, type CardioIntensity, type CaloriesSource } from './hooks/useCardioLogs'
import { useProfile } from '../profile/ProfileContext'
import { useDailyLogs } from './hooks/useDailyLogs'
import { useBodyweightKg } from '../weight/hooks/useBodyweightKg'
import {
  CARDIO_ACTIVITIES,
  CATEGORY_LABEL,
  estimateCalories,
  findCardioActivity,
  matchCardioActivity,
  paceLabel,
  type CardioActivity,
  type CardioCategory,
} from '../../lib/constants/cardioActivities'
import { localTodayISO, localDateISO } from '../../lib/utils'
import { Term } from '../../components/ui/Term'

const INTENSITY_OPTIONS: { value: CardioIntensity; label: string }[] = [
  { value: 'zone2', label: 'Zone 2' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
]

const INTENSITY_COLORS: Record<CardioIntensity, string> = {
  zone2: 'bg-emerald-500/20 text-emerald-400',
  low: 'bg-blue-500/20 text-blue-400',
  moderate: 'bg-amber-500/20 text-amber-400',
  high: 'bg-red-500/20 text-red-400',
}

const ZONE2_WEEKLY_TARGET = 2
const CATEGORY_ORDER: CardioCategory[] = ['machine', 'outdoor', 'sport', 'studio']

// RPE (1–10) → the closest intensity bucket, so one tap sets both.
function intensityFromRpe(rpe: number): CardioIntensity {
  if (rpe <= 3) return 'low'
  if (rpe <= 5) return 'zone2'
  if (rpe <= 7) return 'moderate'
  return 'high'
}

export function CardioTracker() {
  const { weekLogs, zone2Count, weeklyCalories, loading, saving, logSession, deleteSession } = useCardioLogs()
  const { assessment } = useProfile()
  const { todayLog } = useDailyLogs()

  // Bodyweight for the MET calorie estimate: latest weigh-in, else assessment.
  const weightKg = useBodyweightKg()

  const [showForm, setShowForm] = useState(false)
  const [activityKey, setActivityKey] = useState<string | null>(null)
  const [type, setType] = useState('') // resolved label or free-text custom
  const [search, setSearch] = useState('')
  const [minutes, setMinutes] = useState('')
  const [distance, setDistance] = useState('')
  const [intensity, setIntensity] = useState<CardioIntensity>('zone2')
  const [rpe, setRpe] = useState<number | null>(null)
  const [caloriesOverride, setCaloriesOverride] = useState<string | null>(null) // non-null once user edits it
  const [logDate, setLogDate] = useState(localTodayISO())
  const [notes, setNotes] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const cardioPrefs = assessment?.responses?.lifestyle?.cardio_preference ?? []
  const activity: CardioActivity | null = findCardioActivity(activityKey) ?? matchCardioActivity(type)
  const mins = parseInt(minutes, 10)
  const dist = parseFloat(distance)

  const estimatedCalories = useMemo(
    () =>
      estimateCalories({
        met: activity?.met ?? null,
        weightKg,
        minutes: Number.isFinite(mins) ? mins : 0,
        intensity,
      }),
    [activity, weightKg, mins, intensity],
  )

  const shownCalories = caloriesOverride !== null ? caloriesOverride : estimatedCalories?.toString() ?? ''
  const pace = paceLabel(Number.isFinite(dist) ? dist : null, Number.isFinite(mins) ? mins : 0)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1600)
  }

  const resetForm = () => {
    setActivityKey(null)
    setType('')
    setSearch('')
    setMinutes('')
    setDistance('')
    setIntensity('zone2')
    setRpe(null)
    setCaloriesOverride(null)
    setLogDate(localTodayISO())
    setNotes('')
  }

  const pickActivity = (a: CardioActivity) => {
    setActivityKey(a.key)
    setType(a.label)
    setSearch('')
    if (a.zone2Capable && intensity === 'moderate') setIntensity('zone2')
  }

  const pickCustom = (text: string) => {
    setActivityKey(null)
    setType(text)
    setSearch('')
  }

  const setRpeValue = (v: number) => {
    const next = rpe === v ? null : v
    setRpe(next)
    if (next !== null) setIntensity(intensityFromRpe(next))
  }

  const handleSave = async () => {
    if (!type.trim() || !Number.isFinite(mins) || mins <= 0) return
    const source: CaloriesSource | null =
      caloriesOverride !== null && caloriesOverride.trim()
        ? 'measured'
        : estimatedCalories != null
          ? 'estimated'
          : null
    const calories =
      caloriesOverride !== null && caloriesOverride.trim()
        ? parseInt(caloriesOverride, 10)
        : estimatedCalories ?? null

    const { error } = await logSession({
      type: type.trim(),
      minutes: mins,
      intensity,
      notes: notes.trim() || undefined,
      activity_key: activityKey,
      distance_km: activity?.tracksDistance && Number.isFinite(dist) && dist > 0 ? dist : null,
      calories: calories != null && Number.isFinite(calories) ? calories : null,
      calories_source: calories != null ? source : null,
      rpe,
      log_date: logDate,
    })
    if (error) {
      showToast('Failed to save cardio')
      return
    }
    showToast('Cardio logged')
    resetForm()
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteSession(id)
    showToast(error ? 'Failed to remove' : 'Removed')
  }

  const filteredActivities = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return CARDIO_ACTIVITIES
    return CARDIO_ACTIVITIES.filter((a) => a.label.toLowerCase().includes(q) || a.key.includes(q))
  }, [search])

  const showCustomOption = search.trim().length > 1 && !filteredActivities.some((a) => a.label.toLowerCase() === search.trim().toLowerCase())

  // Recent days for the backdate picker.
  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-card" />
  }

  const steps = todayLog?.steps ?? null
  const stepsInBand = steps !== null && steps >= 8000 && steps <= 10000
  const stepsAbove = steps !== null && steps > 10000

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">Cardio</h2>
        <span className="text-[10px] text-slate-500">This week</span>
      </div>

      {/* Weekly readout */}
      <div className="rounded-xl bg-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <Heart size={16} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-300"><Term term="zone 2">Zone-2</Term> sessions</span>
              <p className="text-lg font-bold text-white">
                {zone2Count}
                <span className="text-xs font-normal text-slate-400"> / {ZONE2_WEEKLY_TARGET}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {weeklyCalories > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-slate-500">Burned</span>
                <p className="flex items-center gap-1 text-sm font-bold text-orange-400">
                  <Flame size={13} /> {weeklyCalories.toLocaleString()}
                </p>
              </div>
            )}
            {zone2Count >= ZONE2_WEEKLY_TARGET ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Hit target</span>
            ) : (
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                {ZONE2_WEEKLY_TARGET - zone2Count} more
              </span>
            )}
          </div>
        </div>

        {/* Steps readout */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Activity size={16} className="text-blue-400" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-300">Steps today</span>
              <p className="text-lg font-bold text-white">{steps !== null ? steps.toLocaleString() : '—'}</p>
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              stepsAbove || stepsInBand
                ? 'bg-emerald-500/20 text-emerald-400'
                : steps !== null
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-700 text-slate-500'
            }`}
          >
            {steps === null ? 'Not logged' : stepsAbove || stepsInBand ? '8–10k target' : 'Below 8k'}
          </span>
        </div>

        <p className="text-[10px] text-slate-500 leading-tight">
          Aim for 8–10k steps daily + 2× 20–25 min <Term term="zone 2">Zone-2</Term> cardio per week on non-consecutive days.
        </p>
      </div>

      {/* This week's sessions */}
      {weekLogs.length === 0 ? (
        <p className="py-2 text-center text-xs text-slate-500">No cardio sessions logged this week.</p>
      ) : (
        <div className="space-y-1.5">
          {weekLogs.map((log) => {
            const logPace = paceLabel(log.distance_km, log.minutes)
            return (
              <div key={log.id} className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${INTENSITY_COLORS[log.intensity]}`}>
                      {INTENSITY_OPTIONS.find((o) => o.value === log.intensity)?.label ?? log.intensity}
                    </span>
                    <span className="truncate text-xs text-white">{log.type}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                    <span>{log.minutes} min</span>
                    {log.distance_km != null && log.distance_km > 0 && <span>· {log.distance_km} km</span>}
                    {logPace && <span>· {logPace}</span>}
                    {log.calories != null && (
                      <span className="flex items-center gap-0.5 text-orange-400/80">
                        · <Flame size={9} /> {log.calories}
                        {log.calories_source === 'estimated' ? ' est' : ''}
                      </span>
                    )}
                    {log.rpe != null && <span>· RPE {log.rpe}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 py-2.5 text-xs text-slate-400 transition-colors hover:border-emerald-500/50 hover:text-emerald-400"
        >
          <Plus size={14} /> Log cardio session
        </button>
      ) : (
        <div className="rounded-xl bg-card p-3 space-y-3">
          {/* Activity picker */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-500">Activity</label>
            {cardioPrefs.length > 0 && !type && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {cardioPrefs.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      const m = matchCardioActivity(p)
                      if (m) pickActivity(m)
                      else pickCustom(p)
                    }}
                    className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 transition-colors hover:bg-slate-700"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {type ? (
              <div className="flex items-center justify-between rounded-lg bg-slate-800 px-2.5 py-2">
                <span className="text-sm text-white">
                  {type}
                  {activity && <span className="ml-1.5 text-[10px] text-slate-500">{activity.met} <Term term="met">MET</Term></span>}
                </span>
                <button onClick={() => { setType(''); setActivityKey(null) }} className="text-[11px] text-emerald-400">
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-1.5">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search cricket, run, cycling…"
                    className="w-full rounded-lg bg-slate-800 py-1.5 pl-8 pr-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {showCustomOption && (
                  <button
                    onClick={() => pickCustom(search.trim())}
                    className="mb-1.5 w-full rounded-lg border border-dashed border-slate-700 py-1.5 text-[11px] text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
                  >
                    Use “{search.trim()}” (custom)
                  </button>
                )}
                <div className="max-h-40 space-y-2 overflow-y-auto pr-0.5">
                  {CATEGORY_ORDER.map((cat) => {
                    const acts = filteredActivities.filter((a) => a.category === cat)
                    if (acts.length === 0) return null
                    return (
                      <div key={cat}>
                        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-600">{CATEGORY_LABEL[cat]}</p>
                        <div className="flex flex-wrap gap-1">
                          {acts.map((a) => (
                            <button
                              key={a.key}
                              onClick={() => pickActivity(a)}
                              className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Minutes + Distance */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-medium text-slate-500">Minutes</label>
              <input
                type="number"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="25"
                className="w-full rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {activity?.tracksDistance && (
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-medium text-slate-500">
                  Distance (km){pace && <span className="ml-1 text-emerald-400">· {pace}</span>}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="3.5"
                  className="w-full rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Intensity */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-500">Intensity</label>
            <div className="flex flex-wrap gap-1">
              {INTENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setIntensity(opt.value); setRpe(null) }}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    intensity === opt.value ? INTENSITY_COLORS[opt.value] : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calories */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-slate-500">
              <Flame size={11} className="text-orange-400" /> Calories
              {caloriesOverride === null && estimatedCalories != null && <span className="text-slate-600">· estimated</span>}
              {caloriesOverride !== null && (
                <button onClick={() => setCaloriesOverride(null)} className="ml-auto text-[10px] text-emerald-400">
                  Use estimate
                </button>
              )}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={shownCalories}
              onChange={(e) => setCaloriesOverride(e.target.value)}
              placeholder={weightKg ? '—' : 'Add a weight log to auto-estimate'}
              className="w-full rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500"
            />
            {!weightKg && (
              <p className="mt-1 text-[10px] text-amber-400/80">No bodyweight found — log your weight for automatic calorie estimates.</p>
            )}
          </div>

          {/* RPE */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-slate-500">
              <Gauge size={11} /> How hard it felt (<Term term="rpe">RPE</Term>){rpe != null && <span className="text-slate-600">· sets the intensity</span>}
            </label>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                <button
                  key={v}
                  onClick={() => setRpeValue(v)}
                  className={`h-7 w-7 rounded-md text-[11px] font-medium transition-colors ${
                    rpe === v ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Date (backdate) */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-500">Date</label>
            <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recentDays.map((d) => {
                const iso = localDateISO(d)
                const isSel = iso === logDate
                const isToday = iso === localTodayISO()
                return (
                  <button
                    key={iso}
                    onClick={() => setLogDate(iso)}
                    className={`flex min-h-[44px] w-10 shrink-0 flex-col items-center justify-center rounded-lg text-center ${
                      isSel ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[9px] uppercase opacity-70">{isToday ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}</span>
                    <span className="text-sm font-bold leading-tight">{d.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); resetForm() }}
              className="flex-1 rounded-lg bg-slate-800 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !type.trim() || !minutes}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {toast && <p className={`text-center text-xs ${toast.startsWith('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>{toast}</p>}
    </div>
  )
}
