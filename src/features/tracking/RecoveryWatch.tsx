import { useState } from 'react'
import { AlertTriangle, HeartPulse, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useRecoveryWatch } from './hooks/useRecoveryWatch'

// ISO-8601 week key (e.g. "2026-W39") — dismissal lasts the current week.
function isoWeekKey(now: Date): string {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * READ-ONLY recovery advisory card. Shows at the top of Today + Track when the
 * coach's under-recovery rule fires. Purely advisory — it changes no plan, load
 * or log. Dismissal is remembered per ISO week (localStorage). A dismissed
 * "watch" re-surfaces if it escalates to "under_recovered" in the same week;
 * dismissing "under_recovered" hides it for the rest of the week.
 */
export function RecoveryWatch() {
  const { user } = useAuth()
  const { result, loading } = useRecoveryWatch()

  const key = user ? `aefit_recovery_dismiss_${user.id}` : ''
  const week = isoWeekKey(new Date())

  const [dismissed, setDismissed] = useState<string>(() => {
    if (typeof window === 'undefined' || !key) return ''
    return localStorage.getItem(key) ?? ''
  })

  if (loading || !result || result.status === 'ok') return null

  // Stored token is `${week}:${status}`. Hide only when this week's dismissal
  // was for the same-or-higher severity (under_recovered outranks watch).
  const rank = { watch: 1, under_recovered: 2 } as const
  const [dWeek, dStatus] = dismissed.split(':')
  const isUnder = result.status === 'under_recovered'
  if (dWeek === week && rank[(dStatus as 'watch' | 'under_recovered') ?? 'watch'] >= rank[result.status]) {
    return null
  }

  const dismiss = () => {
    const token = `${week}:${result.status}`
    if (key) localStorage.setItem(key, token)
    setDismissed(token)
  }

  const Icon = isUnder ? AlertTriangle : HeartPulse
  const tone = isUnder
    ? { border: 'border-amber-500/40', bg: 'bg-amber-500/10', icon: 'text-amber-400', title: 'text-amber-200' }
    : { border: 'border-sky-500/30', bg: 'bg-sky-500/10', icon: 'text-sky-400', title: 'text-sky-200' }

  return (
    <div className={`flex items-start gap-2 rounded-xl border ${tone.border} ${tone.bg} p-3`}>
      <Icon size={16} className={`mt-0.5 shrink-0 ${tone.icon}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${tone.title}`}>{result.title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">{result.body}</p>

        {result.evidence.notes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.evidence.notes.map((note) => (
              <span
                key={note}
                className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300"
              >
                {note}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="mt-2 min-h-[36px] rounded-lg bg-white/5 px-3 text-[11px] font-medium text-slate-200 active:bg-white/10"
        >
          Got it
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-slate-500 active:text-slate-300"
      >
        <X size={14} />
      </button>
    </div>
  )
}
