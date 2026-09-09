import { EXPERIENCE_LEVELS, type AssessmentTraining } from '../types'

interface Props {
  data: AssessmentTraining
  onChange: (data: AssessmentTraining) => void
}

export function StepTraining({ data, onChange }: Props) {
  const update = (field: keyof AssessmentTraining, value: string | number | null) =>
    onChange({ ...data, [field]: value })

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-100">Training Background</h2>
      <p className="text-sm text-slate-400">Tell us about your experience.</p>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Experience Level</label>
        <div className="grid grid-cols-1 gap-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => update('level', level)}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                data.level === level
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">
          Previous Gym Experience (months)
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={data.gym_months ?? ''}
          onChange={(e) => update('gym_months', e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          placeholder="e.g. 6"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">
          Current Training Frequency (days/week)
        </label>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update('frequency', n)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                data.frequency === n
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Sports Background</label>
        <input
          type="text"
          value={data.sports}
          onChange={(e) => update('sports', e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          placeholder="e.g. Cricket, Badminton"
        />
      </div>
    </div>
  )
}
