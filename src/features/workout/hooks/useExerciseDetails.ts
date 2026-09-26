import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

/** The migration-017/020 cue jsonb shape (all optional — older rows may be sparse). */
export interface ExerciseCues {
  setup?: string[]
  execution?: string[]
  breathing?: string
  common_mistakes?: string[]
  ruin_your_gains?: string[]
}

export interface ExerciseDetail {
  id: string
  name: string
  primary_muscle: string
  secondary_muscles: string[]
  movement_pattern: string
  equipment: string[]
  difficulty: string
  cues: ExerciseCues
  gif_url: string | null
  contraindications: string[]
  media_attribution: string | null
  youtube_id: string | null
  youtube_search_url: string | null
}

const COLS =
  'id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty, cues, gif_url, contraindications, media_attribution, youtube_id, youtube_search_url'

/**
 * Resolves exercise_library ids -> full detail rows (cues, gif, muscles, …) for
 * the rich workout card. Pass the day's ref ids AND their swap-alternative ids
 * so a swap renders instantly without a refetch.
 */
export function useExerciseDetails(ids: string[]) {
  const [details, setDetails] = useState<Record<string, ExerciseDetail>>({})
  const [loading, setLoading] = useState(false)
  const key = [...new Set(ids)].sort().join(',')

  useEffect(() => {
    if (!key) {
      setDetails({})
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('exercise_library')
      .select(COLS)
      .in('id', key.split(','))
      .then(({ data }) => {
        if (cancelled) return
        const map: Record<string, ExerciseDetail> = {}
        for (const r of data ?? []) {
          map[r.id as string] = {
            id: r.id as string,
            name: r.name as string,
            primary_muscle: r.primary_muscle as string,
            secondary_muscles: (r.secondary_muscles as string[]) ?? [],
            movement_pattern: r.movement_pattern as string,
            equipment: (r.equipment as string[]) ?? [],
            difficulty: r.difficulty as string,
            cues: (r.cues as ExerciseCues) ?? {},
            gif_url: (r.gif_url as string | null) ?? null,
            contraindications: (r.contraindications as string[]) ?? [],
            media_attribution: (r.media_attribution as string | null) ?? null,
            youtube_id: (r.youtube_id as string | null) ?? null,
            youtube_search_url: (r.youtube_search_url as string | null) ?? null,
          }
        }
        setDetails(map)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [key])

  return { details, loading }
}
