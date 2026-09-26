// Curated cardio activity library with MET (Metabolic Equivalent of Task) values,
// so calories can be ESTIMATED for activities no machine measures — cricket,
// badminton, outdoor running, cycling, football — not just treadmill readouts.
//
//   calories ≈ MET × bodyweight_kg × (minutes / 60)   (× intensity modifier)
//
// MET values are representative "moderate effort" figures from the 2011
// Compendium of Physical Activities. They're estimates: whenever a device gives
// a real number, the user overrides the estimate in the form.

import type { CardioIntensity } from '../../features/tracking/hooks/useCardioLogs'

export type CardioCategory = 'machine' | 'outdoor' | 'sport' | 'studio'

export interface CardioActivity {
  key: string
  label: string
  category: CardioCategory
  /** representative MET at moderate effort */
  met: number
  /** distance + pace fields make sense (walk/run/cycle/etc.) */
  tracksDistance: boolean
  /** steady-state enough to count toward the Zone-2 weekly target */
  zone2Capable: boolean
}

export const CARDIO_ACTIVITIES: CardioActivity[] = [
  // ── machines ──────────────────────────────────────────────
  { key: 'incline_walk', label: 'Incline walk (treadmill)', category: 'machine', met: 6.0, tracksDistance: true, zone2Capable: true },
  { key: 'treadmill_run', label: 'Treadmill run', category: 'machine', met: 9.8, tracksDistance: true, zone2Capable: false },
  { key: 'stationary_bike', label: 'Stationary bike', category: 'machine', met: 7.0, tracksDistance: true, zone2Capable: true },
  { key: 'elliptical', label: 'Elliptical / cross-trainer', category: 'machine', met: 5.0, tracksDistance: false, zone2Capable: true },
  { key: 'rowing_machine', label: 'Rowing machine', category: 'machine', met: 7.0, tracksDistance: true, zone2Capable: true },
  { key: 'stair_climber', label: 'Stair climber', category: 'machine', met: 9.0, tracksDistance: false, zone2Capable: false },
  { key: 'spin_class', label: 'Spin class', category: 'studio', met: 8.5, tracksDistance: false, zone2Capable: false },

  // ── outdoor / self-powered ────────────────────────────────
  { key: 'walk', label: 'Walk (brisk)', category: 'outdoor', met: 4.3, tracksDistance: true, zone2Capable: true },
  { key: 'run', label: 'Running (outdoor)', category: 'outdoor', met: 9.8, tracksDistance: true, zone2Capable: false },
  { key: 'cycling', label: 'Cycling (outdoor)', category: 'outdoor', met: 7.5, tracksDistance: true, zone2Capable: true },
  { key: 'hiking', label: 'Hiking', category: 'outdoor', met: 6.0, tracksDistance: true, zone2Capable: true },
  { key: 'swimming', label: 'Swimming (laps)', category: 'outdoor', met: 8.3, tracksDistance: true, zone2Capable: true },
  { key: 'jump_rope', label: 'Jump rope / skipping', category: 'outdoor', met: 11.0, tracksDistance: false, zone2Capable: false },

  // ── sports ────────────────────────────────────────────────
  { key: 'cricket', label: 'Cricket', category: 'sport', met: 4.8, tracksDistance: false, zone2Capable: false },
  { key: 'badminton', label: 'Badminton', category: 'sport', met: 5.5, tracksDistance: false, zone2Capable: false },
  { key: 'tennis', label: 'Tennis', category: 'sport', met: 7.3, tracksDistance: false, zone2Capable: false },
  { key: 'table_tennis', label: 'Table tennis', category: 'sport', met: 4.0, tracksDistance: false, zone2Capable: false },
  { key: 'football', label: 'Football (soccer)', category: 'sport', met: 8.0, tracksDistance: false, zone2Capable: false },
  { key: 'basketball', label: 'Basketball', category: 'sport', met: 6.5, tracksDistance: false, zone2Capable: false },
  { key: 'volleyball', label: 'Volleyball', category: 'sport', met: 4.0, tracksDistance: false, zone2Capable: false },
  { key: 'boxing', label: 'Boxing / bag work', category: 'sport', met: 7.8, tracksDistance: false, zone2Capable: false },

  // ── studio ────────────────────────────────────────────────
  { key: 'hiit', label: 'HIIT / circuit', category: 'studio', met: 8.0, tracksDistance: false, zone2Capable: false },
  { key: 'dance', label: 'Dance workout', category: 'studio', met: 5.0, tracksDistance: false, zone2Capable: false },
  { key: 'yoga', label: 'Yoga / mobility', category: 'studio', met: 3.0, tracksDistance: false, zone2Capable: true },
]

export const CATEGORY_LABEL: Record<CardioCategory, string> = {
  machine: 'Machine',
  outdoor: 'Outdoor',
  sport: 'Sport',
  studio: 'Studio',
}

// Intensity nudges the base (moderate) MET up or down. Zone-2 is a steady low-
// moderate effort, so it sits just under moderate.
const INTENSITY_MET_MULT: Record<CardioIntensity, number> = {
  low: 0.85,
  zone2: 0.92,
  moderate: 1.0,
  high: 1.2,
}

const ACTIVITY_BY_KEY = new Map(CARDIO_ACTIVITIES.map((a) => [a.key, a]))

export const findCardioActivity = (key: string | null | undefined): CardioActivity | null =>
  key ? ACTIVITY_BY_KEY.get(key) ?? null : null

/** Loose match of free-text (custom type or old logs) to a library activity. */
export function matchCardioActivity(text: string): CardioActivity | null {
  const q = text.trim().toLowerCase()
  if (!q) return null
  const exact = CARDIO_ACTIVITIES.find((a) => a.key === q || a.label.toLowerCase() === q)
  if (exact) return exact
  return CARDIO_ACTIVITIES.find((a) => a.label.toLowerCase().includes(q) || q.includes(a.key.replace(/_/g, ' '))) ?? null
}

/**
 * Estimate calories for a session. Uses the activity's MET (or a moderate 6.0
 * default for an unknown custom activity), the user's bodyweight, minutes, and
 * intensity. Returns null if we can't estimate (no weight / no minutes).
 */
export function estimateCalories(opts: {
  met: number | null
  weightKg: number | null
  minutes: number
  intensity: CardioIntensity
}): number | null {
  const { met, weightKg, minutes, intensity } = opts
  if (!weightKg || weightKg <= 0 || !minutes || minutes <= 0) return null
  const baseMet = met && met > 0 ? met : 6.0
  const kcal = baseMet * INTENSITY_MET_MULT[intensity] * weightKg * (minutes / 60)
  return Math.round(kcal)
}

/** min/km pace label from distance (km) + minutes, or null. */
export function paceLabel(distanceKm: number | null, minutes: number): string | null {
  if (!distanceKm || distanceKm <= 0 || !minutes || minutes <= 0) return null
  const secPerKm = (minutes * 60) / distanceKm
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}
