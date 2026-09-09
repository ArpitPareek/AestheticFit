import { DAYS_OF_WEEK, SESSION_DURATIONS, TIME_SLOTS, type AssessmentAvailability } from '../types'

interface Props {
  data: AssessmentAvailability
  onChange: (data: AssessmentAvailability) => void
}

export function StepAvailability({ data, onChange }: Props) {
  const toggleDay = (day: string) => {
    const days = data.preferred_days.includes(day)
      ? data.preferred_days.filter((d) => d !== day)
      : [...data.preferred_days, day]
    onChange({ ...data, preferred_days: days })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-100">Availability</h2>
      <p className="text-sm text-slate-400">When can you train?</p>

      <div>
        <label className="mb-2 block text-sm text-slate-400">
          Days per Week: <span className="font-bold text-emerald-400">{data.days_per_week}</span>
        </label>
        <input
          type="range"
          min={3}
          max={7}
          value={data.days_per_week}
          onChange={(e) => onChange({ ...data, days_per_week: Number(e.target.value) })}
          className="w-full accent-emerald-500"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Session Duration</label>
        <div className="flex flex-wrap gap-2">
          {SESSION_DURATIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => onChange({ ...data, session_minutes: mins })}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                data.session_minutes === mins
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Preferred Days</label>
        <div className="grid grid-cols-4 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`rounded-lg border px-2 py-3 text-xs font-medium transition-colors ${
                data.preferred_days.includes(day)
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">Preferred Time</label>
        <div className="flex gap-2">
          {TIME_SLOTS.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => onChange({ ...data, time })}
              className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                data.time === time
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
