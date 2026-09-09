export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function today(): string {
  return formatDate(new Date())
}
