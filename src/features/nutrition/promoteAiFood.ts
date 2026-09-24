import { supabase } from '../../lib/supabase'
import type { InsertTables } from '../../types/supabase'

// Per-single-serving macros. We always promote at unit (quantity = 1) granularity
// so a future log of a different quantity scales correctly off the stored row.
export interface PerServingMacros {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export interface PromotableFood {
  name: string
  unit: string
  perUnit: PerServingMacros
}

// lowercase, trim, collapse internal whitespace — the canonical match key.
export function normalizeFoodName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Look up an existing custom_foods.id for this user by normalized name.
 * Returns null when there's no match.
 */
export async function findCustomFoodId(
  userId: string,
  name: string,
): Promise<string | null> {
  const norm = normalizeFoodName(name)
  const { data } = await supabase
    .from('custom_foods')
    .select('id, name')
    .eq('user_id', userId)
  const match = data?.find((f) => normalizeFoodName(f.name) === norm)
  return match?.id ?? null
}

/**
 * F4 — Promote an AI-estimated food to the user's custom_foods library and seed
 * the shared AI cache. Idempotent per (user, normalized name): a second call
 * reuses the existing row instead of duplicating.
 *
 * Returns the custom_foods.id to attach to the meal_log, or null if promotion
 * failed (the caller still logs the meal, just without a custom_food_id).
 */
export async function promoteAiFood(
  userId: string,
  food: PromotableFood,
): Promise<string | null> {
  const norm = normalizeFoodName(food.name)

  // 1. Already in this user's library? Reuse it — never duplicate.
  const existingId = await findCustomFoodId(userId, food.name)
  if (existingId) return existingId

  // 2. Insert a new custom_foods row with the per-serving AI macros.
  const nowIso = new Date().toISOString()
  const id = crypto.randomUUID()
  const newFood: InsertTables<'custom_foods'> = {
    id,
    user_id: userId,
    name: food.name,
    category: 'ai',
    serving_label: food.unit || 'serving',
    serving_grams: 0,
    calories: Math.round(food.perUnit.calories),
    protein_g: round1(food.perUnit.protein_g),
    carbs_g: round1(food.perUnit.carbs_g),
    fat_g: round1(food.perUnit.fat_g),
    fiber_g: round1(food.perUnit.fiber_g),
    is_recipe: false,
    is_veg: true,
    // custom_foods.source check allows ('manual','ai_parsed','ifct','barcode') —
    // NOT 'ai_estimated'. Using the wrong value here silently fails the insert,
    // so the food never promotes and every log falls back to quick_add.
    source: 'ai_parsed',
    created_at: nowIso,
    updated_at: nowIso,
  }

  const { error: insertError } = await supabase.from('custom_foods').insert(newFood)
  if (insertError) return null

  // 4. Seed the shared AI cache so the next parse-meal call skips the AI.
  // Ignore duplicates — another item/session may have cached the same name.
  const estimate = {
    normalized_name: norm,
    name: food.name,
    calories: Math.round(food.perUnit.calories),
    protein_g: round1(food.perUnit.protein_g),
    carbs_g: round1(food.perUnit.carbs_g),
    fat_g: round1(food.perUnit.fat_g),
    fiber_g: round1(food.perUnit.fiber_g),
    serving_size: food.unit || 'serving',
    serving_grams: 0,
    source: 'ai_estimated',
  }
  // id/created_at are DB-generated (serial + default now()); the generated
  // Insert type marks them required, so narrow the cast to the columns we set.
  await supabase
    .from('ai_food_estimates')
    .upsert(estimate as InsertTables<'ai_food_estimates'>, {
      onConflict: 'normalized_name',
      ignoreDuplicates: true,
    })

  return id
}
