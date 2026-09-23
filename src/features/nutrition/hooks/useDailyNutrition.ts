import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealLogEntry {
  id: string
  meal_type: MealType
  food_id: string | null
  food_name: string
  servings: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface DailyTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

const EMPTY_TOTALS: DailyTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }

export function useDailyNutrition() {
  const { user } = useAuth()
  const [meals, setMeals] = useState<MealLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const todayRef = useRef(new Date().toISOString().split('T')[0])
  const today = todayRef.current

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    supabase
      .from('meal_logs')
      .select('id, meal_type, food_id, food_name, servings, calories, protein_g, carbs_g, fat_g')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        if (data) setMeals(data as MealLogEntry[])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [user, today])

  const addMeal = useCallback(
    async (entry: {
      meal_type: MealType
      food_id: string | null
      food_name: string
      servings: number
      calories: number
      protein_g: number
      carbs_g: number
      fat_g: number
    }) => {
      if (!user) return

      const { data, error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: user.id,
          log_date: today,
          ...entry,
        })
        .select('id, meal_type, food_id, food_name, servings, calories, protein_g, carbs_g, fat_g')
        .single()

      if (!error && data) {
        setMeals((m) => [...m, data as MealLogEntry])
      }
      return { error }
    },
    [user, today],
  )

  const removeMeal = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('meal_logs').delete().eq('id', id)
      if (!error) setMeals((m) => m.filter((e) => e.id !== id))
      return { error }
    },
    [],
  )

  const mealsByType = useCallback(
    (type: MealType) => meals.filter((m) => m.meal_type === type),
    [meals],
  )

  const totals: DailyTotals = useMemo(
    () =>
      meals.length === 0
        ? EMPTY_TOTALS
        : meals.reduce(
            (acc, m) => ({
              calories: acc.calories + m.calories,
              protein_g: acc.protein_g + m.protein_g,
              carbs_g: acc.carbs_g + m.carbs_g,
              fat_g: acc.fat_g + m.fat_g,
            }),
            { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
          ),
    [meals],
  )

  return { meals, totals, mealsByType, addMeal, removeMeal, loading, reload: () => {} }
}
