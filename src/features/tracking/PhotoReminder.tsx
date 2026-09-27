import { useState } from 'react'
import { Camera, X } from 'lucide-react'
import { useProfile } from '../profile/ProfileContext'
import { useAuth } from '../auth/AuthContext'
import { PhotoCaptureRow } from './PhotoTimeline'
import type { ProgressPhotosApi } from './hooks/useProgressPhotos'
import { localTodayISO } from '../../lib/utils'

function weeksSince(start: string | null): number {
  if (!start) return 0
  const s = new Date(start + 'T00:00:00')
  const n = new Date()
  n.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((n.getTime() - s.getTime()) / 604800000))
}

// Every ~4 weeks (from the active plan's start), nudge front/side/back photos —
// the coach's "how it's working" signal that the scale hides. "Add photos" now
// captures & uploads for today via the shared gallery (same instance the
// timeline below renders, so a new photo appears there immediately). Dismissal
// is remembered per 4-week block; the always-present timeline capture remains
// available even after dismissing.
export function PhotoReminder({ gallery }: { gallery: ProgressPhotosApi }) {
  const { activePlan } = useProfile()
  const { user } = useAuth()
  const start = activePlan?.start_date ?? null
  const block = Math.floor(weeksSince(start) / 4) // 0 = baseline, 1 = ~wk4, …
  const key = user ? `aefit_photo_block_${user.id}` : ''

  const [dismissedBlock, setDismissedBlock] = useState<number>(() => {
    if (typeof window === 'undefined' || !key) return -1
    return Number(localStorage.getItem(key) ?? '-1')
  })
  const [expanded, setExpanded] = useState(false)

  if (!start || !user || block <= dismissedBlock) return null

  const dismiss = () => {
    if (key) localStorage.setItem(key, String(block))
    setDismissedBlock(block)
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
      <Camera size={16} className="mt-0.5 shrink-0 text-indigo-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-indigo-200">
          {block === 0 ? 'Take your starting photos' : 'Time for progress photos'}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
          Front, side &amp; back — same light, same time of day, roughly every 4 weeks. Photos and tape are how you see the
          change the scale hides.
        </p>

        {expanded && (
          <div className="mt-2">
            <PhotoCaptureRow gallery={gallery} takenOn={localTodayISO()} />
          </div>
        )}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="min-h-[36px] rounded-lg bg-indigo-500/20 px-3 text-[11px] font-semibold text-indigo-200 active:bg-indigo-500/30"
          >
            {expanded ? 'Hide' : 'Add photos'}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-[36px] rounded-lg bg-white/5 px-3 text-[11px] font-medium text-slate-200 active:bg-white/10"
          >
            Done for now
          </button>
        </div>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-slate-500 active:text-slate-300">
        <X size={14} />
      </button>
    </div>
  )
}
