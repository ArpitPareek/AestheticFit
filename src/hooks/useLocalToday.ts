import { useEffect, useState } from 'react'
import { localTodayISO } from '../lib/utils'

// Returns the current local-timezone date as an ISO YYYY-MM-DD string and
// re-renders whenever that string changes. Solves B19/B20 from the go-live
// playbook: hooks that captured `today` at mount corrupted data any time the
// app stayed open across midnight (meals to yesterday, streak stalled from
// 00:00-05:30 IST because a UTC read said "still yesterday", etc.).
//
// Triggers a check on:
//   - tab becoming visible (`visibilitychange`)
//   - window regaining focus
//   - a 60-second interval (belt-and-suspenders for "always open" tabs and
//     phones where visibilitychange doesn't reliably fire on Android PWAs)
//
// Only calls setState when the ISO actually changes, so downstream `useCallback`
// / `useEffect` dependencies only invalidate on true date-rollover.
export function useLocalToday(): string {
  const [today, setToday] = useState<string>(() => localTodayISO())

  useEffect(() => {
    const check = () => {
      const next = localTodayISO()
      setToday((cur) => (cur === next ? cur : next))
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', check)
    const interval = window.setInterval(check, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', check)
      window.clearInterval(interval)
    }
  }, [])

  return today
}
