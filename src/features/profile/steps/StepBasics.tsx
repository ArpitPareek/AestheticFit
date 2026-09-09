import type { AssessmentBasics } from '../types'

interface Props {
  data: AssessmentBasics
  onChange: (data: AssessmentBasics) => void
}

export function StepBasics({ data, onChange }: Props) {
  const update = (field: keyof AssessmentBasics, value: string | number | null) =>
    onChange({ ...data, [field]: value })

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">About You</h2>
      <p className="text-sm text-slate-400">Let's start with the basics.</p>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Display Name</label>
        <input
          type="text"
          value={data.display_name}
          onChange={(e) => update('display_name', e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          placeholder="Your name"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Age</label>
          <input
            type="number"
            inputMode="numeric"
            value={data.age ?? ''}
            onChange={(e) => update('age', e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            placeholder="25"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Sex</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update('sex', s)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  data.sex === s
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Height (cm)</label>
        <input
          type="number"
          inputMode="decimal"
          value={data.height_cm ?? ''}
          onChange={(e) => update('height_cm', e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          placeholder="175"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Current Weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            value={data.current_weight_kg ?? ''}
            onChange={(e) => update('current_weight_kg', e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            placeholder="75"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Target Weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            value={data.target_weight_kg ?? ''}
            onChange={(e) => update('target_weight_kg', e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            placeholder="70"
          />
        </div>
      </div>
    </div>
  )
}
