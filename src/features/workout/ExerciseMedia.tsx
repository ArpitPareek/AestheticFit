import { useEffect, useRef, useState } from 'react'

/**
 * Renders exercise demo media. Free-exercise-db ships two frames per exercise —
 * `0.jpg` (start) and `1.jpg` (end) — that together read as the movement. gif_url
 * points at the `0.jpg`; we derive the sibling `1.jpg` and, if it loads, cross-fade
 * between the two frames on a timer to fake a GIF. Falls back to the single static
 * frame when there's no second frame (some exercises only vendored one).
 */

const FRAME_MS = 900

/** `/exercise-media/<id>/0.jpg` -> `/exercise-media/<id>/1.jpg`; null if not the frame-0 shape. */
function secondFrameUrl(url: string): string | null {
  return /\/0\.jpg$/.test(url) ? url.replace(/\/0\.jpg$/, '/1.jpg') : null
}

export function ExerciseMedia({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const frame2 = secondFrameUrl(src)
  const [hasFrame2, setHasFrame2] = useState(false)
  const [showFrame2, setShowFrame2] = useState(false)

  // Probe the second frame; only animate once we know it exists.
  useEffect(() => {
    setHasFrame2(false)
    setShowFrame2(false)
    if (!frame2) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setHasFrame2(true)
    }
    img.src = frame2
    return () => {
      cancelled = true
    }
  }, [frame2])

  // Toggle frames on an interval once the second frame is confirmed.
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  useEffect(() => {
    if (!hasFrame2) return
    timer.current = setInterval(() => setShowFrame2((s) => !s), FRAME_MS)
    return () => clearInterval(timer.current)
  }, [hasFrame2])

  if (!hasFrame2 || !frame2) {
    return <img src={src} alt={alt} loading="lazy" className={className} />
  }

  // Base frame drives the layout size; the second frame is overlaid to exactly
  // cover it and cross-fades in/out on the timer.
  return (
    <div className="relative">
      <img src={src} alt={alt} loading="lazy" className={className} />
      <img
        src={frame2}
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
          showFrame2 ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
