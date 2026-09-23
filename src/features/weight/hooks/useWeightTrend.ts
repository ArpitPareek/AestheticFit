import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import type { Views } from '../../../types/supabase'

export type WeightTrendPoint = Pick<Views<'weight_trend'>, 'log_date' | 'ma_7d' | 'ma_28d'>

/**
 * Latest row of the `weight_trend` view (migration 016): 7- and 28-day moving
 * averages of weigh-ins. The 28-day average is the coach's headline signal for
 * Person B — a cycle-smoothed number that ignores daily water/scale noise.
 * Returns null if there aren't enough weigh-ins yet.
 */
export function useWeightTrend() {
  const { user } = useAuth()
  const [latest, setLatest] = useState<WeightTrendPoint | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('weight_trend')
      .select('log_date, ma_7d, ma_28d')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setLatest(data ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  return { latest, loading }
}
