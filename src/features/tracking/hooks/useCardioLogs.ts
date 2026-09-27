import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'
import { localTodayISO, localDateISO } from '../../../lib/utils'
import { useLocalToday } from '../../../hooks/useLocalToday'

export type CardioIntensity = 'zone2' | 'low' | 'moderate' | 'high'
export type CaloriesSource = 'estimated' | 'measured'

export interface CardioLog {
  id: string
  log_date: string
  type: string
  minutes: number
  intensity: CardioIntensity
  notes: string | null
  activity_key: string | null
  distance_km: number | null
  calories: number | null
  calories_source: CaloriesSource | null
  rpe: number | null
}

export interface CardioEntry {
  type: string
  minutes: number
  intensity: CardioIntensity
  notes?: string
  activity_key?: string | null
  distance_km?: number | null
  calories?: number | null
  calories_source?: CaloriesSource | null
  rpe?: number | null
  log_date?: string // defaults to today; set to backdate a session
}

const COLS = 'id, log_date, type, minutes, intensity, notes, activity_key, distance_km, calories, calories_source, rpe'

function isoWeekBounds(d: Date): { start: string; end: string } {
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff)
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
  return { start: localDateISO(mon), end: localDateISO(sun) }
}

export function useCardioLogs() {
  const { user } = useAuth()
  const [weekLogs, setWeekLogs] = useState<CardioLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Re-derive on local-date rollover so the week window advances at midnight
  // even if the tab has been open all night (B20).
  const today = useLocalToday()
  const { start: weekStart, end: weekEnd } = useMemo(
    () => isoWeekBounds(new Date(`${today}T00:00:00`)),
    [today],
  )

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('cardio_logs')
      .select(COLS)
      .eq('user_id', user.id)
      .gte('log_date', weekStart)
      .lte('log_date', weekEnd)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false })
    setWeekLogs((data as CardioLog[] | null) ?? [])
    setLoading(false)
  }, [user, weekStart, weekEnd])

  useEffect(() => { load() }, [load])

  const logSession = useCallback(async (entry: CardioEntry): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }
    setSaving(true)
    const { error } = await supabase.from('cardio_logs').insert({
      user_id: user.id,
      log_date: entry.log_date ?? localTodayISO(),
      type: entry.type,
      minutes: entry.minutes,
      intensity: entry.intensity,
      notes: entry.notes ?? null,
      activity_key: entry.activity_key ?? null,
      distance_km: entry.distance_km ?? null,
      calories: entry.calories ?? null,
      calories_source: entry.calories_source ?? null,
      rpe: entry.rpe ?? null,
    })
    setSaving(false)
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }, [user, load])

  const deleteSession = useCallback(async (id: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }
    const { error } = await supabase.from('cardio_logs').delete().eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }, [user, load])

  const zone2Count = weekLogs.filter(l => l.intensity === 'zone2').length
  const weeklyCalories = weekLogs.reduce((sum, l) => sum + (l.calories ?? 0), 0)

  return { weekLogs, zone2Count, weeklyCalories, loading, saving, logSession, deleteSession, reload: load }
}
