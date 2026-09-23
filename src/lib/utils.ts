// Returns a Date as a local-timezone yyyy-mm-dd string.
// Never use toISOString() for calendar dates — that is UTC and rolls the date
// backward for users in positive-offset timezones (e.g. IST +5:30) when logging
// between midnight and 05:30.
export function localDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function localTodayISO(): string {
  return localDateISO(new Date())
}
