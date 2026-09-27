import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { EMPTY_ASSESSMENT, STEP_LABELS, type AssessmentResponses } from './types'
import type { Json } from '../../types/supabase'
import { StepBasics } from './steps/StepBasics'
import { StepGoals } from './steps/StepGoals'
import { StepTraining } from './steps/StepTraining'
import { StepAvailability } from './steps/StepAvailability'
import { StepEquipment } from './steps/StepEquipment'
import { StepPreferences } from './steps/StepPreferences'
import { StepLifestyle } from './steps/StepLifestyle'
import { StepReview } from './steps/StepReview'

interface Props {
  existingId?: string
  existingData?: AssessmentResponses
  version?: number
  onComplete: () => void
}

export function AssessmentForm({ existingId, existingData, version = 1, onComplete }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<AssessmentResponses>(existingData ?? EMPTY_ASSESSMENT)
  const [assessmentId, setAssessmentId] = useState<string | undefined>(existingId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalSteps = STEP_LABELS.length

  const stepValidation = (idx: number): string | null => {
    if (idx === 0) {
      const b = data.basics
      if (!b.display_name.trim()) return 'Display name is required'
      if (b.age == null || b.age < 10 || b.age > 100) return 'Age must be 10–100'
      if (!b.sex) return 'Select a sex'
      if (b.height_cm == null || b.height_cm < 100 || b.height_cm > 230) return 'Height must be 100–230 cm'
      if (b.current_weight_kg == null || b.current_weight_kg < 30 || b.current_weight_kg > 250) return 'Current weight must be 30–250 kg'
      if (b.target_weight_kg == null || b.target_weight_kg < 30 || b.target_weight_kg > 250) return 'Target weight must be 30–250 kg'
    }
    if (idx === 1 && !data.goals.primary) return 'Pick a primary goal'
    if (idx === 2 && !data.training.level) return 'Pick your experience level'
    if (idx === 3) {
      const a = data.availability
      if (!a.days_per_week || a.days_per_week < 1 || a.days_per_week > 7) return 'Days/week must be 1–7'
      if (!a.session_minutes) return 'Pick session length'
    }
    return null
  }

  const currentStepError = stepValidation(step)
  const canAdvance = currentStepError == null

  const saveProgress = useCallback(
    async (responses: AssessmentResponses) => {
      if (!user) return
      setSaving(true)
      setError('')

      try {
        if (assessmentId) {
          const { error: err } = await supabase
            .from('assessments')
            .update({ responses: responses as unknown as Json })
            .eq('id', assessmentId)
          if (err) throw err
        } else {
          const { data: row, error: err } = await supabase
            .from('assessments')
            .insert({ user_id: user.id, version, responses: responses as unknown as Json })
            .select('id')
            .single()
          if (err) throw err
          setAssessmentId(row.id)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save')
      } finally {
        setSaving(false)
      }
    },
    [user, assessmentId, version]
  )

  const goNext = async () => {
    if (currentStepError) {
      setError(currentStepError)
      return
    }
    await saveProgress(data)
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }

  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleComplete = async () => {
    if (!user || !assessmentId) return
    const basicsErr = stepValidation(0)
    if (basicsErr) {
      setError(basicsErr)
      setStep(0)
      return
    }
    const b = data.basics
    if (
      !b.display_name.trim() ||
      b.age == null ||
      !b.sex ||
      b.height_cm == null ||
      b.current_weight_kg == null ||
      b.target_weight_kg == null
    ) {
      setError('Basics are incomplete')
      setStep(0)
      return
    }
    setSaving(true)
    setError('')

    try {
      const { error: err } = await supabase
        .from('assessments')
        .update({ responses: data as unknown as Json, completed_at: new Date().toISOString() })
        .eq('id', assessmentId)
      if (err) throw err

      const { error: profErr } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: b.display_name.trim(),
        age: b.age,
        sex: b.sex,
        height_cm: b.height_cm,
        current_weight_kg: b.current_weight_kg,
        target_weight_kg: b.target_weight_kg,
        updated_at: new Date().toISOString(),
      })
      if (profErr) throw profErr

      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof AssessmentResponses>(
    key: K,
    value: AssessmentResponses[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const stepContent = [
    <StepBasics data={data.basics} onChange={(v) => updateField('basics', v)} />,
    <StepGoals data={data.goals} onChange={(v) => updateField('goals', v)} />,
    <StepTraining data={data.training} onChange={(v) => updateField('training', v)} />,
    <StepAvailability data={data.availability} onChange={(v) => updateField('availability', v)} />,
    <StepEquipment data={data.equipment} onChange={(v) => updateField('equipment', v)} />,
    <StepPreferences data={data.preferences} onChange={(v) => updateField('preferences', v)} />,
    <StepLifestyle data={data.lifestyle} onChange={(v) => updateField('lifestyle', v)} />,
    <StepReview data={data} />,
  ]

  const isReview = step === totalSteps - 1

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-background px-4 pb-2 pt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Step {step + 1} of {totalSteps}
          </span>
          <span className="text-xs font-medium text-slate-400">{STEP_LABELS[step]}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">{stepContent[step]}</div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="sticky bottom-0 border-t border-slate-800 bg-background px-4 py-3">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}

          {isReview ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving || stepValidation(0) != null}
              title={stepValidation(0) ?? ''}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50"
            >
              <Sparkles size={18} />
              {saving ? 'Saving…' : 'Generate My Plan'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={saving || !canAdvance}
              title={currentStepError ?? ''}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Next'}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}
