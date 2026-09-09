import { GripVertical } from 'lucide-react'
import { PRIMARY_GOALS, PRIORITY_OPTIONS, type AssessmentGoals } from '../types'

interface Props {
  data: AssessmentGoals
  onChange: (data: AssessmentGoals) => void
}

export function StepGoals({ data, onChange }: Props) {
  const togglePriority = (item: string) => {
    const list = data.priorities.includes(item)
      ? data.priorities.filter((p) => p !== item)
      : [...data.priorities, item]
    onChange({ ...data, priorities: list })
  }

  const movePriority = (index: number, direction: -1 | 1) => {
    const list = [...data.priorities]
    const target = index + direction
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    onChange({ ...data, priorities: list })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-100">Your Goals</h2>
      <p className="text-sm text-slate-400">What do you want to achieve?</p>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Primary Goal</label>
        <div className="grid grid-cols-1 gap-2">
          {PRIMARY_GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => onChange({ ...data, primary: goal })}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                data.primary === goal
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Secondary Goal (optional)</label>
        <div className="grid grid-cols-1 gap-2">
          {PRIMARY_GOALS.filter((g) => g !== data.primary).map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() =>
                onChange({ ...data, secondary: data.secondary === goal ? '' : goal })
              }
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                data.secondary === goal
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">
          Priority Ranking (tap to add, drag to reorder)
        </label>
        <div className="space-y-2">
          {PRIORITY_OPTIONS.filter((p) => !data.priorities.includes(p)).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => togglePriority(item)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm text-slate-400 transition-colors"
            >
              + {item}
            </button>
          ))}
        </div>
        {data.priorities.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-500">Your priorities (highest first):</p>
            {data.priorities.map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-emerald-300">{item}</span>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => movePriority(i, -1)}
                    className="px-1 text-slate-500 hover:text-slate-300"
                    aria-label="Move up"
                  >
                    <GripVertical size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => togglePriority(item)}
                  className="px-1 text-slate-500 hover:text-red-400"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
