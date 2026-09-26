import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'

// Tracks which warm-up / cool-down items the user has checked off for a given
// training day, synced to session_prep_logs (migration 035). Keyed by the same
// (log_date, day_label) the workout session uses, so it stays with that day.

export type PrepKind = 'warmup' | 'cooldown'

type DoneMap = Record<PrepKind, Set<string>>

const emptyMap = (): DoneMap => ({ warmup: new Set(), cooldown: new Set() })

export function useSessionPrep(logDate: string, dayLabel: string) {
  const { user } = useAuth()
  const [done, setDone] = useState<DoneMap>(emptyMap)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user || !dayLabel) {
      setDone(emptyMap())
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('session_prep_logs')
      .select('kind, completed_keys')
      .eq('user_id', user.id)
      .eq('log_date', logDate)
      .eq('day_label', dayLabel)
    const next = emptyMap()
    for (const row of data ?? []) {
      const kind = row.kind as PrepKind
      if (kind === 'warmup' || kind === 'cooldown') {
        next[kind] = new Set((row.completed_keys as string[]) ?? [])
      }
    }
    setDone(next)
    setLoading(false)
  }, [user, logDate, dayLabel])

  useEffect(() => { load() }, [load])

  // Optimistic toggle: flip locally, then persist the whole key set for that kind.
  const toggle = useCallback(async (kind: PrepKind, key: string) => {
    if (!user || !dayLabel) return
    const nextSet = new Set(done[kind])
    if (nextSet.has(key)) nextSet.delete(key)
    else nextSet.add(key)
    setDone({ ...done, [kind]: nextSet })

    const { error } = await supabase
      .from('session_prep_logs')
      .upsert(
        {
          user_id: user.id,
          log_date: logDate,
          day_label: dayLabel,
          kind,
          completed_keys: [...nextSet],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,log_date,day_label,kind' },
      )
    if (error) {
      console.error('session_prep_upsert_error', error.message)
      load() // reconcile with the server on failure
    }
  }, [user, logDate, dayLabel, done, load])

  return { done, loading, toggle }
}
