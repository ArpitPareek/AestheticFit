import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

/**
 * Resolves exercise_library ids -> display names. Queries the live table
 * directly rather than the old static EXERCISE_MAP constant, since ids added
 * by migrations (018/019 etc.) only exist in the DB.
 */
export function useExerciseNames(ids: string[]) {
  const [names, setNames] = useState<Record<string, string>>({})
  const key = ids.slice().sort().join(',')

  useEffect(() => {
    if (!key) {
      setNames({})
      return
    }
    let cancelled = false
    supabase
      .from('exercise_library')
      .select('id, name')
      .in('id', key.split(','))
      .then(({ data }) => {
        if (cancelled || !data) return
        setNames(Object.fromEntries(data.map((row) => [row.id, row.name])))
      })
    return () => {
      cancelled = true
    }
  }, [key])

  return { names }
}
