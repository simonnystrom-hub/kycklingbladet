/** Matches calendar dates as `YYYY-MM-DD` (same shape as archive routes). */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDateString(value: string): boolean {
  return ISO_DATE_RE.test(value)
}

export function stockholmToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function parseIsoDateAtNoonUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

export function formatSwedishDate(date: string): string {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Stockholm',
  }).format(parseIsoDateAtNoonUtc(date))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/** Calendar day without weekday, for the Alarmindex source line. */
export function formatSwedishDateShort(date: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Stockholm',
  }).format(parseIsoDateAtNoonUtc(date))
}
