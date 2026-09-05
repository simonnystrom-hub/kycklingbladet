export function alarmPath(date: string, slug: string): string {
  return `/arkiv/${date}/${slug}`
}

export function alarmSlug(headline: string): string {
  const slug = headline
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9åäö]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'larm'
}

export function uniqueAlarmSlug(headline: string, taken: string[]): string {
  const base = alarmSlug(headline)
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export function alarmSlugOrFallback(headline: string, slug?: string | null): string {
  const stored = slug?.trim()
  if (stored) return decodeAlarmSlug(stored)
  return alarmSlug(headline)
}

export function decodeAlarmSlug(value: string): string {
  try {
    return decodeURIComponent(value).normalize('NFC')
  } catch {
    return value.normalize('NFC')
  }
}
