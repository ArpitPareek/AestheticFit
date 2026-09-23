import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/AuthContext'

export type BreakoutLevel = 'none' | 'few' | 'moderate' | 'many'

export interface SkinCheckin {
  id: string
  checkin_date: string
  texture_score: number
  evenness_score: number
  hydration_score: number
  breakout_level: BreakoutLevel
  notes: string | null
}

export function useSkinCheckins() {
  const { user } = useAuth()
  const [checkins, setCheckins] = useState<SkinCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('skin_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('checkin_date', { ascending: true })
    setCheckins((data ?? []) as SkinCheckin[])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const saveCheckin = useCallback(async (checkin: {
    texture_score: number
    evenness_score: number
    hydration_score: number
    breakout_level: BreakoutLevel
    notes?: string
  }): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }
    setSaving(true)
    const today = new Date().toISOString().slice(0, 10)
    const { error } = await supabase
      .from('skin_checkins')
      .insert({
        user_id: user.id,
        checkin_date: today,
        ...checkin,
      })
    setSaving(false)
    if (!error) await load()
    return { error: error?.message ?? null }
  }, [user, load])

  const isDue = (() => {
    if (checkins.length === 0) return true
    const last = checkins[checkins.length - 1]
    const lastDate = new Date(last.checkin_date + 'T00:00:00')
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000)
    return daysSince >= 14
  })()

  return { checkins, loading, saving, saveCheckin, isDue, reload: load }
}
