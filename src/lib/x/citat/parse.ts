import {validateExtraImageBrief, type ExtraImageBrief} from '@/lib/generate/extra-image'
import {normalizeQuotes, wrapStraightQuotes} from '@/lib/generate/quotes'
import {parseHashtagSuggestions} from '@/lib/x/hashtags'

export type GeneratedCitat = {
  text: string
  imageBrief: ExtraImageBrief | null
  hashtags: string[]
}

export function validateGeneratedCitat(input: unknown): GeneratedCitat | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Record<string, unknown>
  const text = typeof record.text === 'string' ? wrapStraightQuotes(record.text) : ''
  if (!text) return null
  return {
    text,
    imageBrief: validateExtraImageBrief(record),
    hashtags: parseHashtagSuggestions(record.hashtags),
  }
}

export function validateCitatSpeechBubble(input: unknown): string | null {
  if (!input || typeof input !== 'object') return null
  const text = typeof (input as {text?: unknown}).text === 'string'
    ? normalizeQuotes((input as {text: string}).text.trim())
    : ''
  if (!text) return null
  if (/https?:\/\//i.test(text)) return null
  if (/@[A-Za-z0-9_]/.test(text) || text.includes('#') || /\p{Extended_Pictographic}/u.test(text)) {
    return null
  }
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 10 || text.length > 80) return null
  return text
}
