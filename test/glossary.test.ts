import { describe, it, expect } from 'vitest'
import { glossary, glossaryEntry } from '../src/lib/constants/glossary'

// Guards the tooltip wiring: every term referenced via <Term term="..."> in the
// UI, and every term the GlossyText auto-linkifier is expected to catch in DB
// cues/notes, must resolve to a definition. A typo'd term prop would silently
// render plain text with no tooltip — this catches that at test time.

// Terms passed explicitly to <Term term="..."> across the app.
const TERM_PROPS = [
  'deload', 'rir', 'total volume', 'prehab', 'ladder', // workout screen
  'zone 2', 'met', 'rpe', // cardio
  'protein floor', 'if', // nutrition
]

// Terms that appear in coach notes / exercise cues and should get a tooltip via
// GlossyText auto-linkify (either kept as-is, or produced by migration 060).
const AUTOLINK_TERMS = [
  'hinge', 'negative', 'brace', 'external rotation', 'pelvic tilt',
  'glute medius', 'soleus', 'cervical', 'isolation', 'compound',
  'eccentric', 'rom', 'lockout', 'supinate', 'posterior chain', 'isometric',
]

describe('glossary', () => {
  it('resolves every <Term> prop used in the UI', () => {
    for (const t of TERM_PROPS) {
      expect(glossaryEntry(t), `missing glossary entry for term="${t}"`).toBeTruthy()
    }
  })

  it('resolves every auto-linkified cue/note term', () => {
    for (const t of AUTOLINK_TERMS) {
      expect(glossaryEntry(t), `missing glossary entry for "${t}"`).toBeTruthy()
    }
  })

  it('every entry has a non-empty title and definition', () => {
    for (const [key, entry] of Object.entries(glossary)) {
      expect(entry.title, `${key} title`).toBeTruthy()
      expect(entry.def.length, `${key} def`).toBeGreaterThan(10)
    }
  })

  it('lookup is case- and spacing-insensitive', () => {
    expect(glossaryEntry('RIR')).toEqual(glossaryEntry('rir'))
    expect(glossaryEntry('  Protein Floor  ')).toEqual(glossaryEntry('protein floor'))
  })
})
