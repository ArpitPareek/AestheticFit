import type { AssessmentResponses } from '../types'

interface Props {
  data: AssessmentResponses
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="mb-2 text-sm font-semibold text-emerald-400">{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between py-1">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  )
}

function Tags({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-sm text-slate-500">None</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export function StepReview({ data }: Props) {
  const { basics, goals, training, availability, equipment, preferences, lifestyle } = data

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">Review Your Answers</h2>
      <p className="text-sm text-slate-400">Make sure everything looks right.</p>

      <Section title="Basics">
        <Row label="Name" value={basics.display_name} />
        <Row label="Age" value={basics.age} />
        <Row label="Sex" value={basics.sex} />
        <Row label="Height" value={basics.height_cm ? `${basics.height_cm} cm` : null} />
        <Row label="Current Weight" value={basics.current_weight_kg ? `${basics.current_weight_kg} kg` : null} />
        <Row label="Target Weight" value={basics.target_weight_kg ? `${basics.target_weight_kg} kg` : null} />
      </Section>

      <Section title="Goals">
        <Row label="Primary" value={goals.primary} />
        <Row label="Secondary" value={goals.secondary || 'None'} />
        <div className="mt-1">
          <span className="text-sm text-slate-400">Priorities: </span>
          <Tags items={goals.priorities} />
        </div>
      </Section>

      <Section title="Training Background">
        <Row label="Level" value={training.level} />
        <Row label="Gym Experience" value={training.gym_months ? `${training.gym_months} months` : null} />
        <Row label="Frequency" value={training.frequency ? `${training.frequency} days/week` : null} />
        <Row label="Sports" value={training.sports || 'None'} />
      </Section>

      <Section title="Availability">
        <Row label="Days/Week" value={availability.days_per_week} />
        <Row label="Session" value={`${availability.session_minutes} min`} />
        <Row label="Time" value={availability.time} />
        <div className="mt-1">
          <span className="text-sm text-slate-400">Days: </span>
          <Tags items={availability.preferred_days.map((d) => d.slice(0, 3))} />
        </div>
      </Section>

      <Section title="Equipment">
        <Tags items={equipment} />
      </Section>

      <Section title="Preferences">
        <Row label="Style" value={preferences.preference} />
        <div className="mt-1">
          <span className="text-sm text-slate-400">Enjoy: </span>
          <Tags items={preferences.enjoy} />
        </div>
        <div className="mt-1">
          <span className="text-sm text-slate-400">Cannot Do: </span>
          <Tags items={preferences.cannot_do} />
        </div>
        {preferences.injuries && <Row label="Injuries" value={preferences.injuries} />}
      </Section>

      <Section title="Lifestyle">
        <div className="mb-1">
          <span className="text-sm text-slate-400">Cardio: </span>
          <Tags items={lifestyle.cardio_preference} />
        </div>
        <Row label="Daily Steps" value={lifestyle.daily_steps} />
        <Row label="Sleep" value={lifestyle.sleep_hours ? `${lifestyle.sleep_hours} hrs` : null} />
        <Row label="Job Type" value={lifestyle.job_type} />
      </Section>
    </div>
  )
}
