import { useEffect, useState } from 'react'
import { Camera, Check, ImageOff, Loader2, X } from 'lucide-react'
import { POSES, type Pose, type ProgressPhoto, type ProgressPhotosApi } from './hooks/useProgressPhotos'

const pad = (n: number) => String(n).padStart(2, '0')
function localTodayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Three capture buttons (front / side / back) for a given date. Mobile file
// inputs with `capture` open the camera directly. Exported so PhotoReminder can
// reuse the exact same control against the shared gallery instance.
export function PhotoCaptureRow({ gallery, takenOn }: { gallery: ProgressPhotosApi; takenOn: string }) {
  const doneToday = new Set(gallery.photos.filter((p) => p.taken_on === takenOn).map((p) => p.pose))

  const onPick = (pose: Pose) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (file) gallery.uploadPhoto(pose, file, takenOn)
  }

  return (
    <div className="flex gap-2">
      {POSES.map((pose) => {
        const done = doneToday.has(pose)
        const busy = gallery.uploading === pose
        return (
          <label
            key={pose}
            className={`flex min-h-[64px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border text-center ${
              done ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/5 active:bg-white/10'
            }`}
          >
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick(pose)} disabled={busy} />
            {busy ? (
              <Loader2 size={16} className="animate-spin text-slate-300" />
            ) : done ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Camera size={16} className="text-slate-300" />
            )}
            <span className="text-[10px] font-medium capitalize text-slate-300">{pose}</span>
          </label>
        )
      })}
    </div>
  )
}

/**
 * Private progress-photo timeline: capture today's poses, then browse
 * thumbnails grouped by date. The bucket is private, so every image (thumbnail
 * and full view) is loaded via a short-lived signed URL — never a public link.
 */
export function PhotoTimeline({ gallery }: { gallery: ProgressPhotosApi }) {
  const { photos, loading, getSignedUrls } = gallery
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [viewPath, setViewPath] = useState<string | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)

  // Sign every thumbnail path whenever the photo list changes.
  useEffect(() => {
    let cancelled = false
    const paths = photos.map((p) => p.storage_path)
    if (!paths.length) {
      setUrls({})
      return
    }
    getSignedUrls(paths).then((map) => {
      if (!cancelled) setUrls(map)
    })
    return () => {
      cancelled = true
    }
  }, [photos, getSignedUrls])

  // Re-sign the single full-view image fresh on open (thumbnails may have expired).
  useEffect(() => {
    if (!viewPath) {
      setViewUrl(null)
      return
    }
    let cancelled = false
    getSignedUrls([viewPath]).then((map) => {
      if (!cancelled) setViewUrl(map[viewPath] ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [viewPath, getSignedUrls])

  // Group by date, preserving the taken_on desc order from the query.
  const groups: { date: string; items: ProgressPhoto[] }[] = []
  for (const p of photos) {
    const last = groups[groups.length - 1]
    if (last && last.date === p.taken_on) last.items.push(p)
    else groups.push({ date: p.taken_on, items: [p] })
  }

  return (
    <div className="rounded-xl bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Camera size={16} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-white">Progress photos</h2>
      </div>

      <PhotoCaptureRow gallery={gallery} takenOn={localTodayISO()} />

      {loading ? (
        <div className="mt-4 h-16 animate-pulse rounded-lg bg-white/5" />
      ) : groups.length === 0 ? (
        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
          No progress photos yet. Capture front, side &amp; back in the same light — this is the timeline that shows the
          change the scale hides.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <div key={g.date}>
              <p className="mb-1.5 text-[11px] font-medium text-slate-400">{formatDate(g.date)}</p>
              <div className="flex gap-2">
                {g.items.map((p) => {
                  const url = urls[p.storage_path]
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setViewPath(p.storage_path)}
                      className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-white/5"
                    >
                      {url ? (
                        <img src={url} alt={p.pose} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <ImageOff size={16} className="text-slate-600" />
                        </span>
                      )}
                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-[9px] font-medium capitalize text-white">
                        {p.pose}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewPath && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setViewPath(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white active:bg-white/20"
            onClick={() => setViewPath(null)}
          >
            <X size={18} />
          </button>
          {viewUrl ? (
            <img src={viewUrl} alt="progress photo" className="max-h-full max-w-full rounded-lg object-contain" />
          ) : (
            <Loader2 size={24} className="animate-spin text-white" />
          )}
        </div>
      )}
    </div>
  )
}
