import { COMMON_EXERCISES, type AssessmentPreferences } from '../types'

interface Props {
  data: AssessmentPreferences
  onChange: (data: AssessmentPreferences) => void
}

const PREF_LABELS = ['Machines', 'Mixed', 'Free Weights', 'Bodyweight'] as const
const PREF_VALUES = ['machines', 'mixed', 'free-weights', 'bodyweight'] as const

export function StepPreferences({ data, onChange }: Props) {
  const toggleList = (field: 'enjoy' | 'cannot_do', item: string) => {
    const list = data[field].includes(item)
      ? data[field].filter((e) => e !== item)
      : [...data[field], item]
    onChange({ ...data, [field]: list })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-100">Preferences & Limitations</h2>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Equipment Preference</label>
        <div className="flex gap-2">
          {PREF_VALUES.map((val, i) => (
            <button
              key={val}
              type="button"
              onClick={() => onChange({ ...data, preference: val })}
              className={`flex-1 rounded-lg border px-2 py-3 text-xs font-medium transition-colors ${
                data.preference === val
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              {PREF_LABELS[i]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Exercises You Enjoy</label>
        <div className="flex flex-wrap gap-2">
          {COMMON_EXERCISES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => toggleList('enjoy', ex)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                data.enjoy.includes(ex)
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Exercises You Cannot Do</label>
        <div className="flex flex-wrap gap-2">
          {COMMON_EXERCISES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => toggleList('cannot_do', ex)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                data.cannot_do.includes(ex)
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Injuries / Limitations</label>
        <textarea
          value={data.injuries}
          onChange={(e) => onChange({ ...data, injuries: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          placeholder="e.g. Lower back pain, shoulder impingement"
        />
      </div>
    </div>
  )
}
