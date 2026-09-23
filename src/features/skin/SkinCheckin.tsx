import { useState } from 'react'
import { Camera, X } from 'lucide-react'
import { useSkinCheckins, type BreakoutLevel } from './hooks/useSkinCheckins'

const BREAKOUT_OPTIONS: { value: BreakoutLevel; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'few', label: 'Few' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'many', label: 'Many' },
]

function ScoreSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-slate-400">{label}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              n <= value
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 120
  const h = 28
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  )
}

interface SkinCheckinFormProps {
  onClose: () => void
}

export function SkinCheckinForm({ onClose }: SkinCheckinFormProps) {
  const { saving, saveCheckin } = useSkinCheckins()
  const [texture, setTexture] = useState(3)
  const [evenness, setEvenness] = useState(3)
  const [hydration, setHydration] = useState(3)
  const [breakouts, setBreakouts] = useState<BreakoutLevel>('none')
  const [toast, setToast] = useState<string | null>(null)

  const handleSave = async () => {
    const { error } = await saveCheckin({
      texture_score: texture,
      evenness_score: evenness,
      hydration_score: hydration,
      breakout_level: breakouts,
    })
    if (error) {
      setToast(error)
    } else {
      setToast('Check-in saved!')
      setTimeout(onClose, 1000)
    }
  }

  return (
    <div className="rounded-xl bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Skin Check-in</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <ScoreSelector label="Texture (smooth → rough)" value={texture} onChange={setTexture} />
        <ScoreSelector label="Evenness (uneven → even)" value={evenness} onChange={setEvenness} />
        <ScoreSelector label="Hydration (dry → plump)" value={hydration} onChange={setHydration} />

        <div>
          <p className="mb-1.5 text-xs text-slate-400">Breakouts</p>
          <div className="flex gap-1.5">
            {BREAKOUT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setBreakouts(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  breakouts === opt.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-slate-800/60 px-3 py-2">
          <Camera size={14} className="mt-0.5 shrink-0 text-slate-500" />
          <p className="text-[11px] leading-relaxed text-slate-500">
            Take a reference photo: same lighting, same angle, morning, after cleansing, before products.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Check-in'}
        </button>

        {toast && <p className="text-center text-xs text-emerald-400">{toast}</p>}
      </div>
    </div>
  )
}

export function CheckinHistory({ checkins }: { checkins: { texture_score: number; evenness_score: number; hydration_score: number }[] }) {
  if (checkins.length < 2) return null

  return (
    <div className="rounded-xl bg-card p-3">
      <h3 className="mb-2 text-xs font-semibold text-slate-300">Check-in Trends</h3>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Texture</span>
          <Sparkline data={checkins.map(c => c.texture_score)} color="#10b981" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Evenness</span>
          <Sparkline data={checkins.map(c => c.evenness_score)} color="#6366f1" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Hydration</span>
          <Sparkline data={checkins.map(c => c.hydration_score)} color="#06b6d4" />
        </div>
      </div>
    </div>
  )
}
