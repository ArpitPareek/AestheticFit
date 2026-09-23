import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'

export interface SkinLog {
  id: string
  log_date: string
  routine_type: 'am' | 'pm'
  steps_done: Record<string, boolean>
}

export function useSkinLogs(logDate: string) {
  const { user } = useAuth()
  const [amLog, setAmLog] = useState<SkinLog | null>(null)
  const [pmLog, setPmLog] = useState<SkinLog | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('skin_logs')
      .select('id, log_date, routine_type, steps_done')
      .eq('user_id', user.id)
      .eq('log_date', logDate)
    const am = data?.find(d => d.routine_type === 'am') ?? null
    const pm = data?.find(d => d.routine_type === 'pm') ?? null
    setAmLog(am as SkinLog | null)
    setPmLog(pm as SkinLog | null)
    setLoading(false)
  }, [user, logDate])

  useEffect(() => { load() }, [load])

  const toggleStep = useCallback(async (
    routineType: 'am' | 'pm',
    stepId: string,
    checked: boolean,
  ) => {
    if (!user) return
    const existing = routineType === 'am' ? amLog : pmLog
    const newSteps = { ...(existing?.steps_done ?? {}), [stepId]: checked }

    if (existing) {
      await supabase
        .from('skin_logs')
        .update({ steps_done: newSteps })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('skin_logs')
        .insert({
          user_id: user.id,
          log_date: logDate,
          routine_type: routineType,
          steps_done: newSteps,
        })
    }
    await load()
  }, [user, logDate, amLog, pmLog, load])

  return { amLog, pmLog, loading, toggleStep }
}
