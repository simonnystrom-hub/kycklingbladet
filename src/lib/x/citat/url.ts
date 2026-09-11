import {wrapStraightQuotes} from '@/lib/generate/quotes'

export function parseTweetStatusId(url: string): string | null {
  return parseTweetPath(url)?.id ?? null
}

export function parseTweetUsername(url: string): string | null {
  const path = parseTweetPath(url)
  if (!path) return null
  if (path.username.toLowerCase() === 'i') return null
  if (!/^[A-Za-z0-9_]{1,15}$/.test(path.username)) return null
  return path.username
}

export function citatInspiredByLine(sourceUrl: string): string | null {
  const username = parseTweetUsername(sourceUrl)
  return username ? `Inspirerad av @${username}` : null
}

export function citatParentText(text: string, sourceUrl: string): string {
  const body = wrapStraightQuotes(text)
  const inspired = citatInspiredByLine(sourceUrl)
  return [body, inspired].filter(Boolean).join('\n\n')
}

export function citatFollowUpText(sourceUrl: string, mentions: string[] = []): string | null {
  const url = sourceUrl.trim()
  if (!parseTweetStatusId(url)) return null
  const source = `Källa:\n${url}`
  if (mentions.length === 0) return source
  return `${mentions.join(' ')}\n${source}`
}

function parseTweetPath(url: string): {username: string; id: string} | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
  if (host !== 'x.com' && host !== 'twitter.com') return null
  const id = parsed.pathname.match(/\/status\/(\d+)/)?.[1]
  if (!id) return null
  const username = parsed.pathname.match(/^\/([^/]+)\/status\//)?.[1] ?? 'i'
  return {username, id}
}
