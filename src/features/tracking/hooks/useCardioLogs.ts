import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'

export type CardioIntensity = 'zone2' | 'low' | 'moderate' | 'high'

export interface CardioLog {
  id: string
  log_date: string
  type: string
  minutes: number
  intensity: CardioIntensity
  notes: string | null
}

function isoWeekBounds(d: Date): { start: string; end: string } {
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff)
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  }
}

export function useCardioLogs() {
  const { user } = useAuth()
  const [weekLogs, setWeekLogs] = useState<CardioLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const today = new Date()
  const { start: weekStart, end: weekEnd } = isoWeekBounds(today)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('cardio_logs')
      .select('id, log_date, type, minutes, intensity, notes')
      .eq('user_id', user.id)
      .gte('log_date', weekStart)
      .lte('log_date', weekEnd)
      .order('created_at', { ascending: false })
    setWeekLogs((data as CardioLog[] | null) ?? [])
    setLoading(false)
  }, [user, weekStart, weekEnd])

  useEffect(() => { load() }, [load])

  const logSession = useCallback(async (entry: {
    type: string
    minutes: number
    intensity: CardioIntensity
    notes?: string
  }): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }
    setSaving(true)
    const { error } = await supabase.from('cardio_logs').insert({
      user_id: user.id,
      log_date: today.toISOString().slice(0, 10),
      type: entry.type,
      minutes: entry.minutes,
      intensity: entry.intensity,
      notes: entry.notes ?? null,
    })
    setSaving(false)
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }, [user, today, load])

  const deleteSession = useCallback(async (id: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }
    const { error } = await supabase.from('cardio_logs').delete().eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }, [user, load])

  const zone2Count = weekLogs.filter(l => l.intensity === 'zone2').length

  return { weekLogs, zone2Count, loading, saving, logSession, deleteSession, reload: load }
}
