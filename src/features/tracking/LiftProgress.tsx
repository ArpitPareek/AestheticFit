import { useEffect, useState } from 'react'
import { Dumbbell, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { ExerciseSet } from '../../lib/types'

interface LiftRow {
  exercise_id: string
  name: string
  latestTop: string
  latestDate: string
  delta1RM: number
  sessions: number
}

// Epley estimated 1RM of the best set — a single comparable number across
// sessions even when reps/weight both move. Ladder/bodyweight/core sets have
// weight 0 → e1rm 0 → excluded (their progress shows in the session card).
function bestE1RM(sets: ExerciseSet[]): { e1rm: number; top: ExerciseSet | null } {
  let e1rm = 0
  let top: ExerciseSet | null = null
  for (const s of sets) {
    const v = (s.weight_kg || 0) * (1 + (s.reps || 0) / 30)
    if (v > e1rm) {
      e1rm = v
      top = s
    }
  }
  return { e1rm, top }
}

// A = "lifts climbing" is a defining success metric (not the scale). This shows
// estimated-1RM change per lift since the first logged session.
export function LiftProgress() {
  const { user } = useAuth()
  const [rows, setRows] = useState<LiftRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('exercise_logs')
      .select('exercise_id, exercise_name, sets, workout_logs!inner(workout_date)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        const byEx = new Map<string, { name: string; sessions: { date: string; e1rm: number; top: ExerciseSet | null }[] }>()
        for (const r of data ?? []) {
          const wl = r.workout_logs as unknown as { workout_date: string }
          const { e1rm, top } = bestE1RM((r.sets as unknown as ExerciseSet[]) ?? [])
          if (e1rm <= 0) continue
          const key = r.exercise_id as string
          const entry = byEx.get(key) ?? { name: (r.exercise_name as string) ?? key, sessions: [] }
          entry.sessions.push({ date: wl.workout_date, e1rm, top })
          byEx.set(key, entry)
        }
        const out: LiftRow[] = []
        for (const [id, e] of byEx) {
          if (e.sessions.length < 2) continue
          const first = e.sessions[0]
          const last = e.sessions[e.sessions.length - 1]
          out.push({
            exercise_id: id,
            name: e.name,
            latestTop: last.top ? `${last.top.weight_kg}kg×${last.top.reps}` : '—',
            latestDate: last.date,
            delta1RM: Math.round((last.e1rm - first.e1rm) * 10) / 10,
            sessions: e.sessions.length,
          })
        }
        out.sort((a, b) => (a.latestDate < b.latestDate ? 1 : -1))
        setRows(out.slice(0, 8))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // Nothing to show until at least one lift has 2+ logged sessions.
  if (loading || rows.length === 0) return null

  return (
    <div className="rounded-xl bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Dumbbell size={18} className="text-emerald-400" />
        <h2 className="text-sm font-semibold text-white">Lifts progress</h2>
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => {
          const up = r.delta1RM > 0.5
          const down = r.delta1RM < -0.5
          return (
            <div key={r.exercise_id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{r.name}</span>
              <span className="shrink-0 text-xs text-slate-400">{r.latestTop}</span>
              <span
                className={`flex w-20 shrink-0 items-center justify-end gap-0.5 text-xs font-medium ${
                  up ? 'text-emerald-400' : down ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {up ? <TrendingUp size={13} /> : down ? <TrendingDown size={13} /> : <Minus size={13} />}
                {r.delta1RM > 0 ? '+' : ''}
                {r.delta1RM} kg
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        Estimated 1-rep-max change since your first logged session (weighted lifts). Climbing = the plan is working —
        this, waist and photos, not the scale.
      </p>
    </div>
  )
}
