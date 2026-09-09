import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { AssessmentResponses } from './types'
import type { GeneratedWorkoutPlan } from '../../lib/types'

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

interface ActivePlan {
  id: string
  plan_name: string
  plan_data: GeneratedWorkoutPlan
  phase: number
  total_phases: number
  start_date: string
  is_active: boolean
}

interface ProfileState {
  profile: Profile | null
  assessment: Assessment | null
  activePlan: ActivePlan | null
  hasCompletedAssessment: boolean
  hasPlan: boolean
  loading: boolean
  reload: () => Promise<void>
}

const ProfileContext = createContext<ProfileState | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setAssessment(null)
      setActivePlan(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const [profileRes, assessmentRes, planRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle(),
    ])

    setProfile(profileRes.data ?? null)
    setAssessment(assessmentRes.data ?? null)
    setActivePlan(planRes.data ?? null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const hasCompletedAssessment = assessment?.completed_at != null
  const hasPlan = activePlan != null

  return (
    <ProfileContext.Provider value={{ profile, assessment, activePlan, hasCompletedAssessment, hasPlan, loading, reload: load }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile must be used within ProfileProvider')
  return context
}
