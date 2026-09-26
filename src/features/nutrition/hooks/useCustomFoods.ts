import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import { normalizeFoodName } from '../promoteAiFood'
import type { Tables } from '../../../types/supabase'

export type CustomFood = Tables<'custom_foods'>

// The fields the My Foods editor can change.
export interface CustomFoodPatch {
  name?: string
  serving_label?: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  is_veg?: boolean
}

export function useCustomFoods() {
  const { user } = useAuth()
  const [foods, setFoods] = useState<CustomFood[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setFoods([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })
    setFoods((data as CustomFood[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const updateFood = useCallback(async (id: string, patch: CustomFoodPatch) => {
    const { error } = await supabase
      .from('custom_foods')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) {
      setFoods((f) => f.map((x) => (x.id === id ? { ...x, ...patch } as CustomFood : x)))
    }
    return { error }
  }, [])

  const deleteFood = useCallback(async (id: string) => {
    // Unlink from historical logs first — the FK would otherwise block the
    // delete. Logged macros are snapshotted on the meal_logs row, so totals are
    // untouched; we flip source→quick_add so the meal_log_identity check still
    // holds (source='quick_add' OR exactly one of food_id/custom_food_id).
    await supabase
      .from('meal_logs')
      .update({ custom_food_id: null, source: 'quick_add' })
      .eq('custom_food_id', id)
    const { error } = await supabase.from('custom_foods').delete().eq('id', id)
    if (!error) setFoods((f) => f.filter((x) => x.id !== id))
    return { error }
  }, [])

  // Merge same-named foods: keep the oldest row, repoint any logs at it, drop
  // the rest. Returns how many rows were removed.
  const dedupe = useCallback(async () => {
    const groups = new Map<string, CustomFood[]>()
    for (const f of foods) {
      const key = normalizeFoodName(f.name)
      const arr = groups.get(key) ?? []
      arr.push(f)
      groups.set(key, arr)
    }
    let removed = 0
    for (const arr of groups.values()) {
      if (arr.length < 2) continue
      const [keep, ...dups] = [...arr].sort((a, b) => a.created_at.localeCompare(b.created_at))
      for (const dup of dups) {
        await supabase.from('meal_logs').update({ custom_food_id: keep.id }).eq('custom_food_id', dup.id)
        const { error } = await supabase.from('custom_foods').delete().eq('id', dup.id)
        if (!error) removed++
      }
    }
    if (removed > 0) await load()
    return removed
  }, [foods, load])

  // Count of rows that are duplicates (everything past the first per name).
  const duplicateCount = (() => {
    const seen = new Set<string>()
    let dups = 0
    for (const f of foods) {
      const key = normalizeFoodName(f.name)
      if (seen.has(key)) dups++
      else seen.add(key)
    }
    return dups
  })()

  return { foods, loading, duplicateCount, updateFood, deleteFood, dedupe, reload: load }
}
