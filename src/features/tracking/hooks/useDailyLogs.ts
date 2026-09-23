import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import { localTodayISO } from '../../../lib/utils'

export interface DailyLog {
  id: string
  log_date: string
  steps: number | null
  sleep_hours: number | null
  water_glasses: number | null
}

export function useDailyLogs() {
  const { user } = useAuth()
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const today = localTodayISO()

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('daily_logs')
      .select('id, log_date, steps, sleep_hours, water_glasses')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle()
    setTodayLog(data ?? null)
    setLoading(false)
  }, [user, today])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (
    fields: { steps?: number | null; sleep_hours?: number | null; water_glasses?: number | null },
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }
    setSaving(true)

    let error: string | null = null
    if (todayLog) {
      const { error: e } = await supabase
        .from('daily_logs')
        .update(fields)
        .eq('id', todayLog.id)
      if (e) error = e.message
    } else {
      const { error: e } = await supabase
        .from('daily_logs')
        .insert({ user_id: user.id, log_date: today, ...fields })
      if (e) error = e.message
    }

    setSaving(false)
    if (!error) await load()
    return { error }
  }, [user, todayLog, today, load])

  return { todayLog, loading, saving, save, reload: load }
}
