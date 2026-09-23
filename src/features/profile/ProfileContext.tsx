import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { AssessmentResponses } from './types'
import type { WorkoutPlanRow } from '../workout/planGenerator'

interface Profile {
  id: string
  display_name: string
  age: number | null
  sex: string | null
  height_cm: number | null
  current_weight_kg: number | null
  target_weight_kg: number | null
}

interface Assessment {
  id: string
  version: number
  responses: AssessmentResponses
  completed_at: string | null
  created_at: string
}

const PLAN_ROW_SELECT =
  'id, plan_name, plan_data, phase, total_phases, start_date, is_active, plan_source, sort_order, phase_weeks'

interface ProfileState {
  profile: Profile | null
  assessment: Assessment | null
  activePlan: WorkoutPlanRow | null
  /** Latest generated-but-not-yet-approved plan (is_active=false), if any. */
  draftPlan: WorkoutPlanRow | null
  hasCompletedAssessment: boolean
  hasPlan: boolean
  loading: boolean
  reload: () => Promise<void>
  /** Fetches the latest inactive plan on demand (call only when !hasPlan). */
  loadDraftPlan: () => Promise<void>
}

const ProfileContext = createContext<ProfileState | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [activePlan, setActivePlan] = useState<WorkoutPlanRow | null>(null)
  const [draftPlan, setDraftPlan] = useState<WorkoutPlanRow | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setAssessment(null)
      setActivePlan(null)
      setDraftPlan(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const [profileRes, assessmentRes, activePlanRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('workout_plans').select(PLAN_ROW_SELECT).eq('user_id', user.id).eq('is_active', true).maybeSingle(),
    ])

    setProfile(profileRes.data ?? null)
    setAssessment((assessmentRes.data as unknown as Assessment) ?? null)
    setActivePlan((activePlanRes.data as unknown as WorkoutPlanRow) ?? null)
    setDraftPlan(null)
    setLoading(false)
  }, [user])

  const loadDraftPlan = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('workout_plans')
      .select(PLAN_ROW_SELECT)
      .eq('user_id', user.id)
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setDraftPlan((data as unknown as WorkoutPlanRow) ?? null)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const hasCompletedAssessment = assessment?.completed_at != null
  const hasPlan = activePlan != null

  return (
    <ProfileContext.Provider
      value={{ profile, assessment, activePlan, draftPlan, hasCompletedAssessment, hasPlan, loading, reload: load, loadDraftPlan }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile must be used within ProfileProvider')
  return context
}
