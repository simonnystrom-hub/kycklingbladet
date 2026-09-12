import {wrapStraightQuotes} from '@/lib/generate/quotes'
import {xHashtagLine} from '@/lib/x/hashtags'
import type {XCopyLanguage} from '@/lib/x/language'

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

export function citatInspiredByLine(
  sourceUrl: string,
  language: XCopyLanguage = 'sv',
): string | null {
  const username = parseTweetUsername(sourceUrl)
  if (!username) return null
  return language === 'en' ? `Inspired by @${username}` : `Inspirerad av @${username}`
}

export function citatParentText(
  text: string,
  sourceUrl: string,
  language: XCopyLanguage = 'sv',
  hashtags?: unknown,
): string {
  const body = wrapStraightQuotes(text)
  const inspired = citatInspiredByLine(sourceUrl, language)
  return [body, inspired, xHashtagLine(hashtags)].filter(Boolean).join('\n\n')
}

export function citatFollowUpText(
  sourceUrl: string,
  mentions: string[] = [],
  language: XCopyLanguage = 'sv',
): string | null {
  const url = sourceUrl.trim()
  if (!parseTweetStatusId(url)) return null
  const label = language === 'en' ? 'Source:' : 'Källa:'
  const source = `${label}\n${url}`
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
