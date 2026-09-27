import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import { useLocalToday } from '../../../hooks/useLocalToday'

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

  const today = useLocalToday()

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

  const pendingFieldsRef = useRef<{ steps?: number | null; sleep_hours?: number | null; water_glasses?: number | null }>({})
  const pendingResolversRef = useRef<Array<(result: { error: string | null }) => void>>([])
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(async () => {
    const fields = pendingFieldsRef.current
    pendingFieldsRef.current = {}
    const resolvers = pendingResolversRef.current
    pendingResolversRef.current = []
    debounceTimerRef.current = null

    if (!user || Object.keys(fields).length === 0) {
      resolvers.forEach(r => r({ error: null }))
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from('daily_logs')
      .upsert({ user_id: user.id, log_date: today, ...fields }, { onConflict: 'user_id,log_date' })
    setSaving(false)

    const result = { error: error?.message ?? null }
    if (!error) await load()
    resolvers.forEach(r => r(result))
  }, [user, today, load])

  const save = useCallback((
    fields: { steps?: number | null; sleep_hours?: number | null; water_glasses?: number | null },
  ): Promise<{ error: string | null }> => {
    if (!user) return Promise.resolve({ error: 'Not signed in' })

    pendingFieldsRef.current = { ...pendingFieldsRef.current, ...fields }
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    const promise = new Promise<{ error: string | null }>((resolve) => {
      pendingResolversRef.current.push(resolve)
    })
    debounceTimerRef.current = setTimeout(() => { flush() }, 300)
    return promise
  }, [user, flush])

  return { todayLog, loading, saving, save, reload: load }
}
