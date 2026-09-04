import {normalizeQuotes} from './quotes'

export function validateNoticePickIds(input: unknown): string[] | null {
  if (!input || typeof input !== 'object') return null
  const raw = (input as Record<string, unknown>).headlineIds
  if (!Array.isArray(raw)) return null
  const ids = raw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
  return ids
}

export function validateGeneratedNotice(input: unknown): {headline: string; body: string} | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Record<string, unknown>
  const headline = typeof record.headline === 'string' ? record.headline.trim() : ''
  const body = typeof record.body === 'string' ? record.body.trim() : ''
  if (!headline || !body) return null
  return {headline: normalizeQuotes(headline), body: normalizeQuotes(body)}
}
