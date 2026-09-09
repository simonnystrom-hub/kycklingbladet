import {validateExtraImageBrief, type ExtraImageBrief} from '@/lib/generate/extra-image'
import {normalizeQuotes} from '@/lib/generate/quotes'

export type GeneratedCitat = {
  text: string
  imageBrief: ExtraImageBrief | null
}

export function validateGeneratedCitat(input: unknown): GeneratedCitat | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Record<string, unknown>
  const text = typeof record.text === 'string' ? normalizeQuotes(record.text.trim()) : ''
  if (!text) return null
  return {text, imageBrief: validateExtraImageBrief(record)}
}
