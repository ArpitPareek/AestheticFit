import { useState, useEffect } from 'react'
import { Footprints, Moon, GlassWater, Minus, Plus } from 'lucide-react'
import { useDailyLogs } from './hooks/useDailyLogs'

export function DailyTracker() {
  const { todayLog, loading, saving, save } = useDailyLogs()

  const [steps, setSteps] = useState('')
  const [sleep, setSleep] = useState('')
  const [water, setWater] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (todayLog) {
      setSteps(todayLog.steps?.toString() ?? '')
      setSleep(todayLog.sleep_hours?.toString() ?? '')
      setWater(todayLog.water_glasses ?? 0)
    }
  }, [todayLog])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }

  const saveSteps = async () => {
    const val = steps ? parseInt(steps, 10) : null
    if (val !== null && (isNaN(val) || val < 0)) return
    const { error } = await save({ steps: val })
    showToast(error ? 'Failed to save steps' : 'Steps saved')
  }

  const saveSleep = async () => {
    const val = sleep ? parseFloat(sleep) : null
    if (val !== null && (isNaN(val) || val < 0 || val > 24)) return
    const { error } = await save({ sleep_hours: val })
    showToast(error ? 'Failed to save sleep' : 'Sleep saved')
  }

  const saveWater = async (newVal: number) => {
    const clamped = Math.max(0, Math.min(30, newVal))
    setWater(clamped)
    const { error } = await save({ water_glasses: clamped })
    showToast(error ? 'Failed to save' : `${clamped} glasses`)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    )
  }

  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">Daily Log</h2>
        <span className="text-[10px] text-slate-500">{todayLabel}</span>
      </div>

      {/* Steps */}
      <div className="rounded-xl bg-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Footprints size={16} className="text-blue-400" />
            </div>
            <span className="text-xs font-medium text-slate-300">Steps</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={steps}
              onChange={e => setSteps(e.target.value)}
              onBlur={saveSteps}
              placeholder="0"
              className="w-20 rounded-lg bg-slate-800 px-2.5 py-1.5 text-right text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Sleep */}
      <div className="rounded-xl bg-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
              <Moon size={16} className="text-purple-400" />
            </div>
            <span className="text-xs font-medium text-slate-300">Sleep (hrs)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={sleep}
              onChange={e => setSleep(e.target.value)}
              onBlur={saveSleep}
              placeholder="0"
              className="w-20 rounded-lg bg-slate-800 px-2.5 py-1.5 text-right text-sm text-white outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Water */}
      <div className="rounded-xl bg-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
              <GlassWater size={16} className="text-cyan-400" />
            </div>
            <span className="text-xs font-medium text-slate-300">Water</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => saveWater(water - 1)}
              disabled={saving || water <= 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30"
            >
              <Minus size={16} />
            </button>
            <span className="w-10 text-center text-sm font-bold text-white">{water}</span>
            <button
              onClick={() => saveWater(water + 1)}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
            <span className="text-[10px] text-slate-500">glasses</span>
          </div>
        </div>
      </div>

      {toast && (
        <p className={`text-center text-xs ${toast.startsWith('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>{toast}</p>
      )}
    </div>
  )
}
