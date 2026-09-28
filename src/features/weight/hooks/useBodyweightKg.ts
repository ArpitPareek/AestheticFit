import { useWeightLogs } from './useWeightLogs'
import { useProfile } from '../../profile/ProfileContext'

/**
 * The user's best-known bodyweight (kg) for calorie estimates: latest weigh-in,
 * else the assessment's stated weight, else null. Single source of truth so the
 * cardio and strength estimators resolve weight identically.
 */
export function useBodyweightKg(): number | null {
  const { logs } = useWeightLogs()
  const { assessment } = useProfile()
  return (
    (logs.length ? logs[logs.length - 1].weight_kg : null) ??
    assessment?.responses?.basics?.current_weight_kg ??
    null
  )
}
