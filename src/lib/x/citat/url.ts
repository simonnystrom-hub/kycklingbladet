export function citatFollowUpText(sourceUrl: string): string | null {
  const url = sourceUrl.trim()
  if (!parseTweetStatusId(url)) return null
  return `Inspirerat av: ${url}`
}

export function parseTweetStatusId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
  if (host !== 'x.com' && host !== 'twitter.com') return null
  const match = parsed.pathname.match(/\/status\/(\d+)/)
  return match?.[1] ?? null
}
