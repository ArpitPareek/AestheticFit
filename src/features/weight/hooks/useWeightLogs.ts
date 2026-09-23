import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import type { Tables } from '../../../types/supabase'

export type WeightLog = Pick<
  Tables<'weight_logs'>,
  'id' | 'log_date' | 'weight_kg' | 'waist_cm' | 'hip_cm' | 'bust_cm' | 'notes'
>

export type BodyMeasures = Pick<Tables<'weight_logs'>, 'waist_cm' | 'hip_cm' | 'bust_cm'>

export function useWeightLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('weight_logs')
      .select('id, log_date, weight_kg, waist_cm, hip_cm, bust_cm, notes')
      .eq('user_id', user.id)
      .order('log_date', { ascending: true })
    setLogs(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const upsert = useCallback(async (
    logDate: string,
    weightKg: number,
    measures: BodyMeasures,
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }
    setSaving(true)

    const existing = logs.find(l => l.log_date === logDate)
    const tape = { waist_cm: measures.waist_cm, hip_cm: measures.hip_cm, bust_cm: measures.bust_cm }

    let error: string | null = null
    if (existing) {
      const { error: e } = await supabase
        .from('weight_logs')
        .update({ weight_kg: weightKg, ...tape })
        .eq('id', existing.id)
      if (e) error = e.message
    } else {
      const { error: e } = await supabase
        .from('weight_logs')
        .insert({ user_id: user.id, log_date: logDate, weight_kg: weightKg, ...tape })
      if (e) error = e.message
    }

    setSaving(false)
    if (!error) await load()
    return { error }
  }, [user, logs, load])

  return { logs, loading, saving, upsert, reload: load }
}
