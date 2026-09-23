import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'

export interface WeightTrendPoint {
  log_date: string
  ma_7d: number | null
  ma_28d: number | null
}

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
        setLatest((data as WeightTrendPoint) ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  return { latest, loading }
}
