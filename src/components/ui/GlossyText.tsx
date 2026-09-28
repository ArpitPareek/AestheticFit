import { Fragment } from 'react'
import { glossary } from '../../lib/constants/glossary'
import { Term } from './Term'

// Auto-linkify: takes a plain string (a coach note or an exercise cue from the
// DB) and wraps any known glossary terms in a <Term> so they become tap-to-
// explain tooltips — WITHOUT rewriting the source text. This is how DB-authored
// content (which we can't wrap term-by-term at author time) still gets the
// plain-English tooltips.
//
// Matching: case-insensitive, whole-word, first occurrence of each term only
// (so a note doesn't turn into a sea of dotted underlines). Terms are matched
// longest-first so "protein floor" wins over "floor".

// Build the match list once: every glossary key, longest first.
const TERMS = Object.keys(glossary).sort((a, b) => b.length - a.length)

// Escape a term for use inside a RegExp.
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// One alternation regex, word-bounded, case-insensitive, global.
const PATTERN = new RegExp(`\\b(${TERMS.map(esc).join('|')})\\b`, 'gi')

export function GlossyText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null

  const out: React.ReactNode[] = []
  const usedKey = new Set<string>() // only first hit of each distinct term
  let lastIndex = 0
  let m: RegExpExecArray | null

  PATTERN.lastIndex = 0
  while ((m = PATTERN.exec(text)) !== null) {
    const matched = m[0]
    const key = matched.toLowerCase()
    // Skip if we've already linked this term once, or it's somehow unknown.
    if (usedKey.has(key) || !glossary[key]) continue
    usedKey.add(key)

    if (m.index > lastIndex) out.push(<Fragment key={`t${lastIndex}`}>{text.slice(lastIndex, m.index)}</Fragment>)
    out.push(
      <Term key={`g${m.index}`} term={key}>
        {matched}
      </Term>,
    )
    lastIndex = m.index + matched.length
  }
  if (lastIndex < text.length) out.push(<Fragment key={`t${lastIndex}`}>{text.slice(lastIndex)}</Fragment>)

  return <span className={className}>{out}</span>
}
