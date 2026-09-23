// IO wrapper around the pure generator (planGeneratorCore.ts). This file talks
// to Supabase: fetches assessment + goal_mode + exercise_library, calls the
// pure core, and writes workout_plans rows. NO LLM calls anywhere — every
// decision comes from planTemplates.ts + exerciseSelector.ts.

import { supabase } from '../../lib/supabase'
import type { AssessmentResponses } from '../profile/types'
import { generatePhasePlanData } from './planGeneratorCore'
import { getPhaseTemplates } from './planTemplates'
import type { GoalMode, LibraryExercise, PlanData } from './planTypes'
import type { Json } from '../../types/supabase'

export { generatePhasePlanData } from './planGeneratorCore'

export interface WorkoutPlanRow {
  id: string
  plan_name: string
  plan_data: PlanData
  phase: number
  total_phases: number
  start_date: string | null
  is_active: boolean
  // 021 coach columns — optional so the generator's own narrower selects still
  // satisfy this type. 'auto_generated' is the effective default when absent.
  plan_source?: string
  sort_order?: number | null
  phase_weeks?: number | null
}

async function fetchLibrary(): Promise<LibraryExercise[]> {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty, contraindications, sfr_rating, stability_demand, alternatives, deprecated')
  if (error) throw error
  return (data ?? []) as LibraryExercise[]
}

async function fetchLatestAssessment(userId: string): Promise<{ id: string; responses: AssessmentResponses } | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select('id, responses')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id, responses: data.responses as unknown as AssessmentResponses }
}

async function fetchGoalMode(userId: string): Promise<GoalMode> {
  const { data } = await supabase
    .from('nutrition_config')
    .select('goal_mode')
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.goal_mode as GoalMode) ?? 'maintain'
}

function planName(goalMode: GoalMode, phaseNumber: number, template: ReturnType<typeof getPhaseTemplates>[number]): string {
  const modeLabel = goalMode === 'cut' ? 'Cut + Retention' : 'Recomposition'
  return `${modeLabel} — Phase ${phaseNumber}: ${template.name}`
}

/**
 * Generates Phase 1 as an INACTIVE draft for review (PlanReview). Idempotent:
 * if a draft already exists for the user's current assessment, returns it
 * instead of inserting a duplicate — safe to call on every PlanReview mount.
 * Does NOT activate anything; call activatePlan() once the user approves.
 */
export async function generateDraftPlan(userId: string): Promise<WorkoutPlanRow> {
  const assessment = await fetchLatestAssessment(userId)
  if (!assessment) throw new Error('No completed assessment found for user')

  const { data: existingDraft, error: existingErr } = await supabase
    .from('workout_plans')
    .select('id, plan_name, plan_data, phase, total_phases, start_date, is_active')
    .eq('user_id', userId)
    .eq('assessment_id', assessment.id)
    .eq('is_active', false)
    .eq('phase', 1)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existingErr) throw existingErr
  if (existingDraft) return existingDraft as unknown as WorkoutPlanRow

  const [goalMode, library] = await Promise.all([fetchGoalMode(userId), fetchLibrary()])

  const phaseNumber = 1
  const templates = getPhaseTemplates(goalMode)
  const template = templates.find((t) => t.phaseNumber === phaseNumber)!
  const planData = generatePhasePlanData(assessment.responses, goalMode, phaseNumber, library)
  const version = 1

  const { data: inserted, error: insertError } = await supabase
    .from('workout_plans')
    .insert({
      user_id: userId,
      assessment_id: assessment.id,
      plan_version: version,
      plan_name: planName(goalMode, phaseNumber, template),
      plan_data: { ...planData, version } as unknown as Json,
      phase: phaseNumber,
      total_phases: templates.length,
      weeks_per_phase: template.weekEnd - template.weekStart + 1,
      start_date: new Date().toISOString().slice(0, 10),
      is_active: false,
    })
    .select('id, plan_name, plan_data, phase, total_phases, start_date, is_active')
    .single()
  if (insertError) throw insertError
  return inserted as unknown as WorkoutPlanRow
}

/**
 * Activates a specific draft plan (the one just reviewed in PlanReview).
 * Deactivates any prior active plan first — a user should only ever have one
 * is_active=true row.
 */
export async function activatePlan(userId: string, planId: string): Promise<void> {
  const { error } = await supabase.rpc('activate_plan', { p_user: userId, p_plan: planId })
  if (error) throw error
}

/**
 * Reads the user's latest exercise_logs + weight_trend (informational context
 * for the phase transition — adherence/trend are surfaced but the phase
 * CONTENT itself stays deterministic from the template), generates the next
 * phase, and writes it as a NEW workout_plans row (new plan_version). The
 * previous row is deactivated but never mutated — exercise_logs.plan_version_id
 * keeps historical logs tied to the plan version that was active when they
 * were created.
 */
export async function advanceToNextPhase(userId: string): Promise<void> {
  const { data: activePlan, error: activePlanError } = await supabase
    .from('workout_plans')
    .select('id, plan_version, phase, assessment_id, plan_source')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (activePlanError) throw activePlanError
  if (!activePlan) throw new Error('No active plan to advance from')

  // SAFETY: coach-authored plans have all phases pre-written and advance by
  // flipping is_active (advance_to_coach_phase RPC), NOT by regenerating from
  // templates. Never let this generic regenerator silently replace a coach plan.
  if (activePlan.plan_source === 'coach_authored') {
    throw new Error('Coach-authored plan — advance via advance_to_coach_phase, not the generator')
  }

  const nextPhaseNumber = activePlan.phase + 1

  const [assessmentRes, goalMode, library] = await Promise.all([
    supabase.from('assessments').select('id, responses').eq('id', activePlan.assessment_id).maybeSingle(),
    fetchGoalMode(userId),
    fetchLibrary(),
    // Informational context for the transition — not required for deterministic
    // content, but read per spec so future adaptive logic (e.g. auto-extend a
    // phase on poor adherence) has the data already wired in.
    supabase.from('exercise_logs').select('id, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('weight_trend').select('log_date, ma_7d, ma_14d, ma_28d').eq('user_id', userId).order('log_date', { ascending: false }).limit(1),
  ])
  if (assessmentRes.error) throw assessmentRes.error
  if (!assessmentRes.data) throw new Error('Assessment not found')

  const templates = getPhaseTemplates(goalMode)
  const template = templates.find((t) => t.phaseNumber === nextPhaseNumber)
  if (!template) throw new Error(`Phase ${nextPhaseNumber} does not exist for goal_mode=${goalMode} — plan is complete`)

  const assessment = assessmentRes.data.responses as unknown as AssessmentResponses
  const planData = generatePhasePlanData(assessment, goalMode, nextPhaseNumber, library)

  const nextVersion = activePlan.plan_version + 1

  await supabase.from('workout_plans').update({ is_active: false }).eq('id', activePlan.id)

  const { error: insertError } = await supabase.from('workout_plans').insert({
    user_id: userId,
    assessment_id: activePlan.assessment_id,
    plan_version: nextVersion,
    plan_name: planName(goalMode, nextPhaseNumber, template),
    plan_data: { ...planData, version: nextVersion } as unknown as Json,
    phase: nextPhaseNumber,
    total_phases: templates.length,
    weeks_per_phase: template.weekEnd - template.weekStart + 1,
    start_date: new Date().toISOString().slice(0, 10),
    is_active: true,
  })
  if (insertError) throw insertError
}
