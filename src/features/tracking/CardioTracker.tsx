import { useState } from 'react'
import { Heart, Plus, Trash2, Activity } from 'lucide-react'
import { useCardioLogs, type CardioIntensity } from './hooks/useCardioLogs'
import { useProfile } from '../profile/ProfileContext'
import { useDailyLogs } from './hooks/useDailyLogs'

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

export function CardioTracker() {
  const { weekLogs, zone2Count, loading, saving, logSession, deleteSession } = useCardioLogs()
  const { assessment } = useProfile()
  const { todayLog } = useDailyLogs()

  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('')
  const [minutes, setMinutes] = useState('')
  const [intensity, setIntensity] = useState<CardioIntensity>('zone2')
  const [notes, setNotes] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const cardioPrefs = assessment?.responses?.lifestyle?.cardio_preference ?? []

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }

  const handleSave = async () => {
    const mins = parseInt(minutes, 10)
    if (!type.trim() || isNaN(mins) || mins <= 0) return
    const { error } = await logSession({ type: type.trim(), minutes: mins, intensity, notes: notes.trim() || undefined })
    if (error) {
      showToast('Failed to save cardio')
      return
    }
    showToast('Cardio logged')
    setType('')
    setMinutes('')
    setIntensity('zone2')
    setNotes('')
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteSession(id)
    showToast(error ? 'Failed to remove' : 'Removed')
  }

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
              <span className="text-xs font-medium text-slate-300">Zone-2 sessions</span>
              <p className="text-lg font-bold text-white">
                {zone2Count}
                <span className="text-xs font-normal text-slate-400"> / {ZONE2_WEEKLY_TARGET}</span>
              </p>
            </div>
          </div>
          {zone2Count >= ZONE2_WEEKLY_TARGET ? (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              Hit target
            </span>
          ) : (
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              {ZONE2_WEEKLY_TARGET - zone2Count} more
            </span>
          )}
        </div>

        {/* Steps readout */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Activity size={16} className="text-blue-400" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-300">Steps today</span>
              <p className="text-lg font-bold text-white">
                {steps !== null ? steps.toLocaleString() : '—'}
              </p>
            </div>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            stepsAbove
              ? 'bg-emerald-500/20 text-emerald-400'
              : stepsInBand
                ? 'bg-emerald-500/20 text-emerald-400'
                : steps !== null
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-700 text-slate-500'
          }`}>
            {steps === null ? 'Not logged' : stepsAbove || stepsInBand ? '8–10k target' : 'Below 8k'}
          </span>
        </div>

        <p className="text-[10px] text-slate-500 leading-tight">
          Aim for 8–10k steps daily + 2× 20–25 min Zone-2 cardio per week on non-consecutive days.
        </p>
      </div>

      {/* This week's sessions */}
      {weekLogs.length === 0 ? (
        <p className="py-2 text-center text-xs text-slate-500">No cardio sessions logged this week.</p>
      ) : (
        <div className="space-y-1.5">
          {weekLogs.map(log => (
            <div key={log.id} className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${INTENSITY_COLORS[log.intensity]}`}>
                  {INTENSITY_OPTIONS.find(o => o.value === log.intensity)?.label ?? log.intensity}
                </span>
                <span className="truncate text-xs text-white">{log.type}</span>
                <span className="shrink-0 text-[10px] text-slate-500">{log.minutes} min</span>
              </div>
              <button
                onClick={() => handleDelete(log.id)}
                className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
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
          {/* Type */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-500">Type</label>
            {cardioPrefs.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {cardioPrefs.map(p => (
                  <button
                    key={p}
                    onClick={() => setType(p)}
                    className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                      type === p
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder="e.g. incline walk, bike"
              className="w-full rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Minutes + Intensity row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-medium text-slate-500">Minutes</label>
              <input
                type="number"
                inputMode="numeric"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                placeholder="25"
                className="w-full rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-medium text-slate-500">Intensity</label>
              <div className="flex flex-wrap gap-1">
                {INTENSITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setIntensity(opt.value)}
                    className={`rounded-full px-2 py-1 text-[10px] font-medium transition-colors ${
                      intensity === opt.value
                        ? INTENSITY_COLORS[opt.value]
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
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

      {toast && (
        <p className={`text-center text-xs ${toast.startsWith('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>{toast}</p>
      )}
    </div>
  )
}
