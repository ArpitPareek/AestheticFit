import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import { useLocalToday } from '../../../hooks/useLocalToday'
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

// Deterministic per-item dedupe key: retrying the same parse batch (same user,
// date, and item content) reproduces the same key, so a network-fail-then-retry
// re-submit is skipped by the `meal_logs_user_dedupe_uidx` unique index instead
// of creating a second row. Not a real UUID (no randomness) — just formatted as one.
function fnv1a(str: string, seed: number): number {
  let hash = seed
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function dedupeKeyFor(seed: string): string {
  const hex = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35]
    .map(salt => fnv1a(seed, salt).toString(16).padStart(8, '0'))
    .join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

export function useDailyNutrition() {
  const { user } = useAuth()
  const [meals, setMeals] = useState<MealLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  // Local-date-reactive: reads current local date, re-renders on rollover
  // (visibilitychange, focus, or 60-second interval). Prior behavior captured
  // the date at mount, which sent every meal past midnight to yesterday (B19).
  // If the parse is mid-flight when the date flips, the resolved log_date
  // reflects the moment of INSERT, which is the semantically correct "when
  // I ate this."
  const today = useLocalToday()

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
      const rows: InsertTables<'meal_logs'>[] = entries.map((entry, index) => ({
        user_id: user.id,
        log_date: today,
        dedupe_key: dedupeKeyFor(
          [user.id, today, index, entry.meal_type, entry.food_name, entry.servings, entry.calories].join('|'),
        ),
        ...entry,
      }))

      const { data, error } = await supabase
        .from('meal_logs')
        .upsert(rows, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })
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
