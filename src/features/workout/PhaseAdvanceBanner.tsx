import { useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { CoachPhaseStatus } from './planProgress'

interface Props {
  status: CoachPhaseStatus
  /** the CURRENT phase number (the one that just ended) */
  phase: number
  onAdvanced: () => void | Promise<void>
}

// Persistent banner shown once a coach phase has fully elapsed. It NEVER advances
// on its own — the athlete taps "Start Phase N+1", then confirms, and only then
// does the atomic RPC flip is_active. If they ignore it, it simply keeps showing.
export function PhaseAdvanceBanner({ status, phase, onAdvanced }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!status.phaseEnded) return null

  if (status.isComplete) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
        <p className="text-sm font-semibold text-emerald-300">Program complete</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
          You&rsquo;ve finished Phase {phase}, the final one. Hold here — keep training light and easy. Your progress is
          in the logs for your coach to pick up.
        </p>
      </div>
    )
  }

  if (!status.canAdvance || status.nextPhase == null) return null
  const next = status.nextPhase

  const advance = async () => {
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('advance_to_coach_phase', { target_phase: next })
    if (rpcError) {
      setError(rpcError.message || 'Could not advance — try again')
      setBusy(false)
      return
    }
    await onAdvanced() // reloads the active plan; banner disappears once the new phase is active
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-200">Phase {phase} complete</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
            You&rsquo;ve reached the end of this phase. Start Phase {next} when you&rsquo;re ready — it begins counting from
            the day you tap.
          </p>

          {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-2 flex min-h-[40px] items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white active:bg-amber-700"
            >
              Start Phase {next} <ArrowRight size={14} />
            </button>
          ) : (
            <div className="mt-2 space-y-1.5">
              <p className="text-[11px] font-medium text-slate-200">
                This ends Phase {phase} and starts Phase {next}. Continue?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={advance}
                  disabled={busy}
                  className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Yes, start Phase {next}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="min-h-[40px] rounded-lg bg-white/5 px-3 text-xs font-medium text-slate-300 active:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
