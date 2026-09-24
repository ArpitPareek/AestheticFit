import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import { localTodayISO } from '../../../lib/utils'
import type { InsertTables, Tables } from '../../../types/supabase'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const MEAL_LOG_SELECT = 'id, meal_type, food_id, food_name, servings, calories, protein_g, carbs_g, fat_g, item_label, source' as const

export type MealLogEntry = Pick<
  Tables<'meal_logs'>,
  | 'id' | 'food_id' | 'food_name' | 'servings' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'
  | 'item_label' | 'source'
> & { meal_type: MealType }

export type NewMealLogEntry = Pick<
  InsertTables<'meal_logs'>,
  | 'food_id'
  | 'custom_food_id'
  | 'food_name'
  | 'servings'
  | 'calories'
  | 'protein_g'
  | 'carbs_g'
  | 'fat_g'
  | 'fiber_g'
  | 'source'
  | 'item_label'
> & { meal_type: MealType }

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
  // Captured once at mount: prevents date from flipping mid-session.
  const todayRef = useRef(localTodayISO())
  const today = todayRef.current

  const fetchMeals = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user) { setLoading(false); return }
    // Background refetches (realtime, reconnect on tab refocus) must not flip the
    // loading flag — that would unmount MealLogger's subtree and wipe any parsed
    // meal the user is mid-way through confirming.
    if (!opts?.silent) setLoading(true)
    const { data } = await supabase
      .from('meal_logs')
      .select(MEAL_LOG_SELECT)
      .eq('user_id', user.id)
      .eq('log_date', today)
      .order('created_at', { ascending: true })
    if (data) setMeals(data as MealLogEntry[])
    setLoading(false)
  }, [user, today])

  useEffect(() => {
    fetchMeals()
  }, [fetchMeals])

  // Realtime: re-fetch whenever any meal_log row changes for this user+date.
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`meal_logs:${user.id}:${today}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_logs', filter: `user_id=eq.${user.id}` },
        () => { fetchMeals({ silent: true }) },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, today, fetchMeals])

  const addMeal = useCallback(
    async (entry: NewMealLogEntry) => {
      if (!user) return

      const { data, error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: user.id,
          log_date: today,
          ...entry,
        })
        .select(MEAL_LOG_SELECT)
        .single()

      if (!error && data) {
        setMeals((m) => [...m, data as MealLogEntry])
      }
      return { error }
    },
    [user, today],
  )

  const addMeals = useCallback(
    async (entries: NewMealLogEntry[]) => {
      if (!user || entries.length === 0) return
      const rows: InsertTables<'meal_logs'>[] = entries.map((entry) => ({
        user_id: user.id,
        log_date: today,
        ...entry,
      }))

      const { data, error } = await supabase
        .from('meal_logs')
        .insert(rows)
        .select(MEAL_LOG_SELECT)

      if (!error && data) {
        setMeals((m) => [...m, ...(data as MealLogEntry[])])
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

  return { meals, totals, mealsByType, addMeal, addMeals, removeMeal, loading, reload: fetchMeals }
}
