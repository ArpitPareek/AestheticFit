import { useCallback, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export type ParsedSource = 'ifct' | 'ai_estimated' | 'custom'

export interface ParsedItem {
  name: string
  quantity: number
  unit: string
  food_id?: string | null
  custom_food_id?: string | null
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  source: ParsedSource
  matched: boolean
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

export type ParseStatus = 'idle' | 'parsing' | 'done' | 'error'

// Discriminated result so callers can branch without inspecting hook state.
export type ParseOutcome =
  | { ok: true; data: ParseResult }
  | { ok: false; manual: boolean }

export function useMealParser() {
  const [status, setStatus] = useState<ParseStatus>('idle')
  const [result, setResult] = useState<ParseResult | null>(null)

  const parse = useCallback(async (text: string): Promise<ParseOutcome> => {
    setStatus('parsing')
    setResult(null)

    try {
      const { data, error } = await supabase.functions.invoke<ParseResult>('parse-meal', {
        body: { text },
      })

      // Non-200 or empty body → treat as a soft failure, offer manual entry.
      if (error || !data) {
        setStatus('error')
        return { ok: false, manual: true }
      }

      // Both providers down, or nothing understood → manual fallback.
      if (data.manual_entry || data.items.length === 0) {
        setStatus('error')
        return { ok: false, manual: true }
      }

      setResult(data)
      setStatus('done')
      return { ok: true, data }
    } catch {
      setStatus('error')
      return { ok: false, manual: true }
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
  }, [])

  return { status, result, parse, reset }
}
