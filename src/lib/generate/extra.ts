import {validateExtraImageBrief, type ExtraImageBrief} from './extra-image'
import {normalizeQuotes} from './quotes'

export type GeneratedExtra = {
  headline: string
  body: string
  imageBrief: ExtraImageBrief | null
}

export function validateGeneratedExtra(input: unknown): GeneratedExtra | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Record<string, unknown>
  const headline = typeof record.headline === 'string' ? record.headline.trim() : ''
  const body = typeof record.body === 'string' ? record.body.trim() : ''
  if (!headline || !body) return null
  return {
    headline: normalizeQuotes(headline),
    body: normalizeQuotes(body),
    imageBrief: validateExtraImageBrief(record),
  }
}
