import { useState } from 'react'
import { Dumbbell, RefreshCw, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useProfile } from './ProfileContext'
import { AssessmentForm } from './AssessmentForm'
import { EXERCISE_MAP } from '../../lib/constants/exercises'
import type { AssessmentResponses } from './types'
import type { GeneratedWorkoutPlan } from '../../lib/types'

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, assessment, activePlan, reload } = useProfile()
  const [retaking, setRetaking] = useState(false)
  const [resettingPlan, setResettingPlan] = useState(false)

  if (retaking) {
    return (
      <AssessmentForm
        version={(assessment?.version ?? 0) + 1}
        onComplete={() => {
          setRetaking(false)
          reload()
        }}
      />
    )
  }

  const responses = assessment?.responses as AssessmentResponses | undefined
  const plan = activePlan?.plan_data as GeneratedWorkoutPlan | undefined

  const handleResetPlan = async () => {
    if (!user || !activePlan) return
    setResettingPlan(true)
    await supabase
      .from('workout_plans')
      .update({ is_active: false })
      .eq('id', activePlan.id)
    await reload()
    setResettingPlan(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">Profile</h2>

      {profile && (
        <div className="rounded-2xl border border-slate-700 bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-emerald-400">Personal Info</h3>
          <div className="space-y-2 text-sm">
            <Row label="Name" value={profile.display_name} />
            <Row label="Age" value={profile.age?.toString()} />
            <Row label="Sex" value={profile.sex} />
            <Row label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : undefined} />
            <Row label="Weight" value={profile.current_weight_kg ? `${profile.current_weight_kg} kg` : undefined} />
            <Row label="Target" value={profile.target_weight_kg ? `${profile.target_weight_kg} kg` : undefined} />
          </div>
        </div>
      )}

      {/* Active Plan Summary */}
      {plan && activePlan && (
        <div className="rounded-2xl border border-slate-700 bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <Dumbbell size={14} />
            Active Plan
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Plan" value={plan.planName} />
            <Row label="Duration" value={`${plan.totalWeeks} weeks`} />
            <Row label="Phases" value={plan.phases.length.toString()} />
            <Row label="Current Phase" value={`${activePlan.phase} — ${plan.phases[activePlan.phase - 1]?.name ?? ''}`} />
            <Row label="Started" value={activePlan.start_date} />
          </div>

          {/* Quick view of current phase training days */}
          <div className="mt-3 border-t border-slate-800 pt-3">
            <p className="text-[11px] font-medium text-slate-400 mb-2">Current Week</p>
            <div className="space-y-1.5">
              {plan.phases[activePlan.phase - 1]?.weeklySchedule
                .filter((d) => d.type !== 'rest')
                .map((day) => (
                  <div key={day.dayOfWeek} className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-slate-500 w-8 shrink-0 pt-0.5">
                      {day.dayOfWeek.slice(0, 3).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200">{day.dayLabel}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {day.mainExercises
                          .map((e) => EXERCISE_MAP.get(e.exerciseId)?.name ?? e.exerciseId)
                          .join(', ')}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-600 shrink-0">{day.estimatedMinutes}m</span>
                  </div>
                ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetPlan}
            disabled={resettingPlan}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 py-2.5 text-xs font-medium text-red-400 transition-colors active:bg-red-500/10 disabled:opacity-50"
          >
            <Trash2 size={14} />
            {resettingPlan ? 'Resetting…' : 'Reset & Regenerate Plan'}
          </button>
        </div>
      )}

      {responses && (
        <>
          <div className="rounded-2xl border border-slate-700 bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-emerald-400">Assessment Summary</h3>
            <div className="space-y-2 text-sm">
              <Row label="Primary Goal" value={responses.goals.primary} />
              <Row label="Experience" value={responses.training.level} />
              <Row label="Days/Week" value={responses.availability.days_per_week.toString()} />
              <Row label="Session" value={`${responses.availability.session_minutes} min`} />
              <Row label="Preference" value={responses.preferences.preference} />
              <Row label="Version" value={`v${assessment?.version}`} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-emerald-400">Equipment</h3>
            <div className="flex flex-wrap gap-1.5">
              {responses.equipment.map((item) => (
                <span key={item} className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                  {item}
                </span>
              ))}
              {responses.equipment.length === 0 && (
                <span className="text-sm text-slate-500">None selected</span>
              )}
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setRetaking(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
      >
        <RefreshCw size={16} />
        Retake Assessment
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  )
}
