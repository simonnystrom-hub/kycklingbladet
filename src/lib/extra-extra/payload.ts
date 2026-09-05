import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'

export type ExtraExtraPreview = {
  kicker: string
  headline: string
  body: string
  sourceUrl: string
  sourceHeadline: string
  sourceNewspaper: string
  sourceNewspaperSlug: string
  promptVersion: string
  modelVersion: string
}

const STRING_FIELDS = [
  'kicker',
  'headline',
  'body',
  'sourceUrl',
  'sourceHeadline',
  'sourceNewspaper',
  'sourceNewspaperSlug',
  'promptVersion',
  'modelVersion',
] as const satisfies readonly (keyof ExtraExtraPreview)[]

export function parseExtraPreview(input: unknown): ExtraExtraPreview | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null

  const value = input as Record<string, unknown>
  if (STRING_FIELDS.some((field) => typeof value[field] !== 'string')) return null
  if (value.kicker !== EXTRA_KICKER) return null

  try {
    if (new URL(value.sourceUrl as string).protocol !== 'https:') return null
  } catch {
    return null
  }

  return Object.fromEntries(STRING_FIELDS.map((field) => [field, value[field]])) as ExtraExtraPreview
}
