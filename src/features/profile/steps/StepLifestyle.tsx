import { CARDIO_OPTIONS, JOB_TYPES, type AssessmentLifestyle } from '../types'

interface Props {
  data: AssessmentLifestyle
  onChange: (data: AssessmentLifestyle) => void
}

export function StepLifestyle({ data, onChange }: Props) {
  const toggleCardio = (item: string) => {
    const list = data.cardio_preference.includes(item)
      ? data.cardio_preference.filter((c) => c !== item)
      : [...data.cardio_preference, item]
    onChange({ ...data, cardio_preference: list })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-100">Cardio & Lifestyle</h2>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Preferred Cardio</label>
        <div className="flex flex-wrap gap-2">
          {CARDIO_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleCardio(option)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                data.cardio_preference.includes(option)
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Average Daily Steps</label>
        <input
          type="number"
          inputMode="numeric"
          value={data.daily_steps ?? ''}
          onChange={(e) =>
            onChange({ ...data, daily_steps: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          placeholder="e.g. 5000"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Average Sleep (hours)</label>
        <input
          type="number"
          inputMode="decimal"
          value={data.sleep_hours ?? ''}
          onChange={(e) =>
            onChange({ ...data, sleep_hours: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          placeholder="e.g. 7"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Job Type</label>
        <div className="flex gap-2">
          {JOB_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ ...data, job_type: type })}
              className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                data.job_type === type
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
