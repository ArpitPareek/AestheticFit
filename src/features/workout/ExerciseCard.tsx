import { useState } from 'react'
import type { Exercise } from '../../lib/constants/exercises'

const difficultyColor: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
}

const patternLabel: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  hinge: 'Hinge',
  squat: 'Squat',
  carry: 'Carry',
  isolation: 'Isolation',
}

interface ExerciseCardProps {
  exercise: Exercise
  compact?: boolean
}

export default function ExerciseCard({ exercise, compact }: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false)

  const muscles = [exercise.primary_muscle, ...exercise.secondary_muscles]
    .map((m) => m.replace('_', ' '))
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1))

  return (
    <div className="rounded-xl bg-card border border-white/5 overflow-hidden">
      <button
        type="button"
        className="w-full text-left px-4 py-3 flex items-start gap-3 active:bg-white/5 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">
              {exercise.name}
            </h3>
            {exercise.flags?.behind_neck && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                Behind-neck
              </span>
            )}
            {exercise.flags?.heavy_grip_dependence && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                Grip-heavy
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${difficultyColor[exercise.difficulty]}`}
            >
              {exercise.difficulty}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
              {patternLabel[exercise.movement_pattern]}
            </span>
            <span className="text-[11px] text-gray-400 truncate">
              {muscles.join(' · ')}
            </span>
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-gray-500 shrink-0 mt-1 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && !compact && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">How to perform</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {exercise.instructions}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-green-400 mb-1">Form cues</p>
            <ul className="space-y-0.5">
              {exercise.form_cues.map((cue) => (
                <li key={cue} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-green-500 shrink-0">✓</span>
                  {cue}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium text-red-400 mb-1">Common mistakes</p>
            <ul className="space-y-0.5">
              {exercise.common_mistakes.map((mistake) => (
                <li key={mistake} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-red-500 shrink-0">✗</span>
                  {mistake}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] text-gray-500">
              Equipment:{' '}
              <span className="text-gray-400">
                {exercise.equipment
                  .map((e) => e.replace('_', ' '))
                  .join(', ')}
              </span>
            </p>
          </div>

          <a
            href={exercise.youtube_search_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 px-3 py-2 rounded-lg active:bg-red-500/20 transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Watch Tutorial
          </a>
        </div>
      )}
    </div>
  )
}
