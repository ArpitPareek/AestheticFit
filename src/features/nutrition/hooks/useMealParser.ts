import { useCallback, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
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
      const { data, error } = await supabase.functions.invoke<ParseResult>('parse-meal', {
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

      if (!data) {
        console.warn('[parse-meal] empty response body')
        setStatus('error')
        return { ok: false, kind: 'manual' }
      }

      console.info('[parse-meal] result', data)

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
