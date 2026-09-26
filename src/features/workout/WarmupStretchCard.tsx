import { useState } from 'react'
import { Flame, Leaf, Check, ChevronDown } from 'lucide-react'
import type { RoutineItem } from '../../lib/constants/warmupStretch'
import type { PrepKind } from './hooks/useSessionPrep'

// Collapsible, ordered warm-up / cool-down checklist. Items are numbered so the
// user follows them in sequence, and each tap toggles a DB-synced "done" mark.
export function WarmupStretchCard({
  kind,
  items,
  done,
  onToggle,
}: {
  kind: PrepKind
  items: RoutineItem[]
  done: Set<string>
  onToggle: (kind: PrepKind, key: string) => void
}) {
  const isWarmup = kind === 'warmup'
  // Warm-up defaults open (you do it first); cool-down starts collapsed.
  const [expanded, setExpanded] = useState(isWarmup)

  const doneCount = items.filter((it) => done.has(it.key)).length
  const allDone = doneCount === items.length && items.length > 0

  const Icon = isWarmup ? Flame : Leaf
  const title = isWarmup ? 'Warm-up' : 'Cool-down & stretch'
  const accent = isWarmup ? 'text-orange-400' : 'text-teal-400'
  const accentBg = isWarmup ? 'bg-orange-500/15' : 'bg-teal-500/15'

  return (
    <div className="overflow-hidden rounded-2xl bg-card">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentBg}`}>
          <Icon size={18} className={accent} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-[11px] text-slate-400">
            {isWarmup ? 'Before you lift' : 'After your last set'} · {items.length} moves
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            allDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-300'
          }`}
        >
          {doneCount}/{items.length}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <ul className="border-t border-white/5 px-2 pb-2 pt-1">
          {items.map((it, i) => {
            const isDone = done.has(it.key)
            return (
              <li key={it.key}>
                <button
                  type="button"
                  onClick={() => onToggle(kind, it.key)}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left active:bg-white/5"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                      isDone ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-white/20 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check size={14} /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${isDone ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{it.name}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-500">{it.detail}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
