// Bridges the assessment's free-text `preferences.injuries` field to the
// structured `exercise_library.contraindications` tag vocabulary. The DB side
// is tag-based (cervical, shoulder, knee, lower_back, wrist, ...); the
// assessment side is a single free-text string. Keyword matching is the only
// place these two vocabularies meet.

export const CONTRAINDICATION_TAGS = [
  'cervical',
  'shoulder',
  'lower_back',
  'knee',
  'wrist',
] as const

export type ContraindicationTag = (typeof CONTRAINDICATION_TAGS)[number]

const KEYWORD_TO_TAG: Record<string, ContraindicationTag> = {
  cervical: 'cervical',
  neck: 'cervical',
  'c-spine': 'cervical',
  shoulder: 'shoulder',
  rotator: 'shoulder',
  impingement: 'shoulder',
  'lower back': 'lower_back',
  'lower-back': 'lower_back',
  lumbar: 'lower_back',
  'l-spine': 'lower_back',
  sciatica: 'lower_back',
  knee: 'knee',
  patella: 'knee',
  acl: 'knee',
  meniscus: 'knee',
  wrist: 'wrist',
  carpal: 'wrist',
}

/** Free-text injuries string -> structured contraindication tags to filter against. */
export function injuryTextToTags(injuries: string): ContraindicationTag[] {
  if (!injuries) return []
  const lower = injuries.toLowerCase()
  const tags = new Set<ContraindicationTag>()
  for (const [keyword, tag] of Object.entries(KEYWORD_TO_TAG)) {
    if (lower.includes(keyword)) tags.add(tag)
  }
  return Array.from(tags)
}
