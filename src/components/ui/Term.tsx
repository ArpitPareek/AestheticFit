import { useEffect, useId, useRef, useState } from 'react'
import { glossaryEntry } from '../../lib/constants/glossary'

// A jargon term with a plain-English definition on tap. Renders the word with a
// subtle dotted underline; tapping (or clicking) opens a small bubble with the
// explanation from the glossary. Mobile-first: tap to open, tap outside or on the
// term again to close. If the term isn't in the glossary it renders as plain text
// (never a dead-looking link), so it's always safe to wrap.
export function Term({
  term,
  children,
  className = '',
}: {
  /** Glossary key to look up (case/spacing-insensitive). */
  term: string
  /** Visible text; defaults to the term itself. */
  children?: React.ReactNode
  className?: string
}) {
  const entry = glossaryEntry(term)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const bubbleId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // No definition on file → render children (or the term) as plain text.
  if (!entry) return <>{children ?? term}</>

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((p) => !p)
        }}
        aria-expanded={open}
        aria-describedby={open ? bubbleId : undefined}
        className={`cursor-help underline decoration-dotted decoration-slate-500 underline-offset-2 ${className}`}
      >
        {children ?? term}
      </button>
      {open && (
        <span
          id={bubbleId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-1.5 w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-left shadow-xl"
        >
          <span className="block text-[11px] font-semibold text-white">{entry.title}</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-slate-300">{entry.def}</span>
        </span>
      )}
    </span>
  )
}
