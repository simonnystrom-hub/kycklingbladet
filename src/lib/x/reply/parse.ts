import {normalizeQuotes} from '@/lib/generate/quotes'

export function validateGeneratedXReply(input: unknown): string | null {
  if (!input || typeof input !== 'object') return null
  const text = typeof (input as {text?: unknown}).text === 'string'
    ? normalizeQuotes((input as {text: string}).text.trim())
    : ''
  if (!text) return null
  if (/https?:\/\//i.test(text)) return null
  if (/@[A-Za-z0-9_]/.test(text)) return null
  return text
}
