import { EQUIPMENT_OPTIONS } from '../types'

interface Props {
  data: string[]
  onChange: (data: string[]) => void
}

export function StepEquipment({ data, onChange }: Props) {
  const toggle = (item: string) => {
    onChange(
      data.includes(item)
        ? data.filter((e) => e !== item)
        : [...data, item]
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-100">Equipment Access</h2>
      <p className="text-sm text-slate-400">What do you have access to?</p>

      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT_OPTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors ${
              data.includes(item)
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
          >
            {data.includes(item) ? '✓ ' : ''}{item}
          </button>
        ))}
      </div>
    </div>
  )
}
