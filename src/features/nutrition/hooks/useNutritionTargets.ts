import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import type { GoalMode } from '../../workout/planTypes'

export interface NutritionTargets {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2000,
  protein_g: 100,
  carbs_g: 250,
  fat_g: 65,
}

function computeTargets(weight: number, isMale: boolean): NutritionTargets {
  const cal = isMale ? Math.round(weight * 33) : Math.round(weight * 26)
  const protein = isMale ? Math.round(weight * 1.8) : Math.round(weight * 2)
  return {
    calories: cal,
    protein_g: protein,
    carbs_g: Math.round((cal * 0.45) / 4),
    fat_g: Math.round((cal * 0.25) / 9),
  }
}

export function useNutritionTargets() {
  const { user } = useAuth()
  const [targets, setTargets] = useState<NutritionTargets>(DEFAULT_TARGETS)
  const [goalMode, setGoalMode] = useState<GoalMode | null>(null)
  const [hasCustom, setHasCustom] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const [{ data: nt }, { data: profile }, { data: config }] = await Promise.all([
      supabase
        .from('nutrition_targets')
        .select('calories, protein_g, carbs_g, fat_g')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('sex, current_weight_kg')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('nutrition_config')
        .select('goal_mode')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    if (config?.goal_mode) {
      setGoalMode(config.goal_mode as GoalMode)
    }

    if (nt) {
      setTargets({
        calories: Number(nt.calories),
        protein_g: Number(nt.protein_g ?? DEFAULT_TARGETS.protein_g),
        carbs_g: Number(nt.carbs_g ?? DEFAULT_TARGETS.carbs_g),
        fat_g: Number(nt.fat_g ?? DEFAULT_TARGETS.fat_g),
      })
      setHasCustom(true)
    } else if (profile?.current_weight_kg) {
      setTargets(computeTargets(Number(profile.current_weight_kg), profile.sex === 'male'))
      setHasCustom(false)
    }

    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const saveTargets = useCallback(async (t: NutritionTargets): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in' }
    const prev = targets
    setTargets(t)
    setHasCustom(true)
    const { error } = await supabase
      .from('nutrition_targets')
      .upsert({
        user_id: user.id,
        calories: t.calories,
        protein_g: t.protein_g,
        carbs_g: t.carbs_g,
        fat_g: t.fat_g,
      }, { onConflict: 'user_id' })
    if (error) { setTargets(prev); return { error: error.message } }
    return { error: null }
  }, [user, targets])

  const resetTargets = useCallback(async () => {
    if (!user) return
    setHasCustom(false)
    // TODO: drop profiles target columns once verified
    await supabase
      .from('nutrition_targets')
      .delete()
      .eq('user_id', user.id)
    await load()
  }, [user, load])

  return { targets, goalMode, hasCustom, loading, saveTargets, resetTargets }
}
