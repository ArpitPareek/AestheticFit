import { useCallback, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'

export type ParsedSource = 'ifct' | 'ai_estimated' | 'custom'

// One resolved component of a composed dish, with its own macros so the client
// can re-scale it when the user edits its grams.
export interface ParsedIngredient {
  name: string
  grams: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export interface ParsedItem {
  name: string
  quantity: number
  unit: string
  food_id?: string | null
  custom_food_id?: string | null
  // Canonical library name when this resolved to a food row (e.g. 'moongfali'
  // → 'Peanuts'); null for pure AI estimates. Total grams the app understood.
  matched_name?: string | null
  grams?: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  source: ParsedSource
  matched: boolean
  // Present for composed dishes — the editable ingredient breakdown.
  ingredients?: ParsedIngredient[]
}

export interface ParseTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export interface ParseResult {
  items: ParsedItem[]
  totals: ParseTotals
  warnings: string[]
  // Set by the edge function when both AI providers are down and it can't
  // estimate anything — the UI falls back to manual entry.
  manual_entry?: boolean
}

// ─── Raw wire shape ────────────────────────────────────────
// The deployed parse-meal function names fields differently from the canonical
// ParsedItem (matched_food_id vs food_id, source 'library'|'fuzzy', camelCase
// manualEntry). We tolerate BOTH spellings so the UI is correct whether or not
// the function has been redeployed to the clean contract.
interface RawParsedItem {
  name?: string
  quantity?: number
  unit?: string
  food_id?: string | null
  matched_food_id?: string | null
  custom_food_id?: string | null
  matched_name?: string | null
  grams?: number
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  source?: string
  matched?: boolean
  ingredients?: Array<{
    name?: string; grams?: number
    calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number; fiber_g?: number
  }>
}

interface RawParseResponse {
  items?: RawParsedItem[]
  totals?: Partial<ParseTotals>
  warnings?: string[]
  manual_entry?: boolean
  manualEntry?: boolean
}

const num = (n: unknown): number => (Number.isFinite(n) ? Number(n) : 0)

function normalizeSource(raw: string | undefined): ParsedSource {
  if (raw === 'ai_estimated') return 'ai_estimated'
  if (raw === 'custom') return 'custom'
  // 'library' | 'fuzzy' | 'ifct' (or anything else that matched a library row)
  return 'ifct'
}

function normalizeItem(raw: RawParsedItem): ParsedItem {
  const source = normalizeSource(raw.source)
  // food_library reference lives under either name; custom/ai items have none.
  const foodId = source === 'ifct' ? (raw.food_id ?? raw.matched_food_id ?? null) : null
  const q = num(raw.quantity)
  return {
    name: (raw.name ?? '').trim(),
    quantity: q > 0 ? q : 1,
    unit: (raw.unit ?? '').trim(),
    food_id: foodId,
    custom_food_id: raw.custom_food_id ?? null,
    matched_name: raw.matched_name ?? null,
    grams: num(raw.grams),
    calories: num(raw.calories),
    protein_g: num(raw.protein_g),
    carbs_g: num(raw.carbs_g),
    fat_g: num(raw.fat_g),
    fiber_g: num(raw.fiber_g),
    source,
    matched: raw.matched ?? foodId != null,
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients
          .filter((g) => typeof g.name === 'string' && (g.name ?? '').trim().length > 0)
          .map((g) => ({
            name: (g.name ?? '').trim(),
            grams: num(g.grams),
            calories: num(g.calories),
            protein_g: num(g.protein_g),
            carbs_g: num(g.carbs_g),
            fat_g: num(g.fat_g),
            fiber_g: num(g.fiber_g),
          }))
      : undefined,
  }
}

function normalizeResponse(raw: RawParseResponse): ParseResult {
  const t = raw.totals ?? {}
  return {
    items: (raw.items ?? []).map(normalizeItem).filter((it) => it.name.length > 0),
    totals: {
      calories: num(t.calories),
      protein_g: num(t.protein_g),
      carbs_g: num(t.carbs_g),
      fat_g: num(t.fat_g),
      fiber_g: num(t.fiber_g),
    },
    warnings: raw.warnings ?? [],
    manual_entry: raw.manual_entry ?? raw.manualEntry ?? false,
  }
}

export type ParseStatus = 'idle' | 'parsing' | 'done' | 'error'

// Discriminated result so callers can branch without inspecting hook state.
// - 'manual': AI is down / non-200 / network error → drop to manual entry.
// - 'empty':  request succeeded but nothing was parsed → stay, show a message.
export type ParseOutcome =
  | { ok: true; data: ParseResult }
  | { ok: false; kind: 'manual' }
  | { ok: false; kind: 'empty'; warnings: string[] }

export function useMealParser() {
  const [status, setStatus] = useState<ParseStatus>('idle')
  const [result, setResult] = useState<ParseResult | null>(null)

  const parse = useCallback(async (text: string): Promise<ParseOutcome> => {
    setStatus('parsing')
    setResult(null)

    try {
      const { data: raw, error } = await supabase.functions.invoke<RawParseResponse>('parse-meal', {
        body: { text },
      })

      // Non-200: read the body for diagnostics, then fall back to manual entry.
      if (error) {
        let body: unknown = null
        if (error instanceof FunctionsHttpError) {
          try { body = await error.context.json() } catch { /* non-JSON body */ }
        }
        console.warn('[parse-meal] request failed', { error, body })
        setStatus('error')
        return { ok: false, kind: 'manual' }
      }

      if (!raw) {
        console.warn('[parse-meal] empty response body')
        setStatus('error')
        return { ok: false, kind: 'manual' }
      }

      console.info('[parse-meal] raw response', raw)
      const data = normalizeResponse(raw)

      // Explicit both-providers-down signal → manual fallback.
      if (data.manual_entry) {
        setStatus('error')
        return { ok: false, kind: 'manual' }
      }

      // Reachable, but nothing recognised — keep the user on the input screen.
      if (data.items.length === 0) {
        setStatus('done')
        return { ok: false, kind: 'empty', warnings: data.warnings ?? [] }
      }

      setResult(data)
      setStatus('done')
      return { ok: true, data }
    } catch (e) {
      console.warn('[parse-meal] threw', e)
      setStatus('error')
      return { ok: false, kind: 'manual' }
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
  }, [])

  return { status, result, parse, reset }
}
