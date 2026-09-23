import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  streakBroken: boolean
}

export function useStreaks() {
  const { user } = useAuth()
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    streakBroken: false,
  })
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: row } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('streak_type', 'overall')
      .maybeSingle()

    if (!row) {
      setData({ currentStreak: 0, longestStreak: 0, lastActiveDate: null, streakBroken: false })
      setLoading(false)
      return
    }

    const last = row.last_active_date as string | null
    let streakBroken = false
    if (last) {
      const lastDate = new Date(last + 'T00:00:00')
      const todayDate = new Date(today + 'T00:00:00')
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000)
      if (daysDiff > 1) streakBroken = true
    }

    setData({
      currentStreak: streakBroken ? 0 : (row.current_count as number),
      longestStreak: row.longest_count as number,
      lastActiveDate: last,
      streakBroken,
    })
    setLoading(false)
  }, [user, today])

  useEffect(() => { load() }, [load])

  const recordActivity = useCallback(async () => {
    if (!user) return

    const { data: existing } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('streak_type', 'overall')
      .maybeSingle()

    if (!existing) {
      await supabase.from('streaks').insert({
        user_id: user.id,
        streak_type: 'overall',
        current_count: 1,
        longest_count: 1,
        last_active_date: today,
      })
    } else {
      const last = existing.last_active_date as string | null
      if (last === today) return

      let newCount = 1
      if (last) {
        const lastDate = new Date(last + 'T00:00:00')
        const todayDate = new Date(today + 'T00:00:00')
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000)
        if (daysDiff === 1) {
          newCount = (existing.current_count as number) + 1
        }
      }

      const newLongest = Math.max(existing.longest_count as number, newCount)
      await supabase
        .from('streaks')
        .update({
          current_count: newCount,
          longest_count: newLongest,
          last_active_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    }

    await load()
  }, [user, today, load])

  return { ...data, loading, recordActivity }
}

export async function checkTodayActivity(userId: string, today: string, isRestDay: boolean): Promise<boolean> {
  const checks = await Promise.all([
    supabase
      .from('workout_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('workout_date', today),
    supabase
      .from('meal_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('log_date', today),
    supabase
      .from('skin_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('log_date', today),
    supabase
      .from('weight_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('log_date', today),
  ])

  const hasWorkout = (checks[0].count ?? 0) > 0
  const hasMeals = (checks[1].count ?? 0) > 0
  const hasSkin = (checks[2].count ?? 0) > 0
  const hasWeight = (checks[3].count ?? 0) > 0

  if (isRestDay) return hasMeals || hasSkin || hasWeight
  return hasWorkout || hasMeals || hasSkin || hasWeight
}
