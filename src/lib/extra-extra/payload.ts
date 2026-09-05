import {validateExtraImageBrief} from '@/lib/generate/extra-image'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import type {ExtraPreviewImage} from './draw'

export type {ExtraPreviewImage}

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
  imageShotType?: string
  imageCaption?: string
  imagePrompt?: string
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

const IMAGE_FIELDS = ['imageShotType', 'imageCaption', 'imagePrompt'] as const

export function parseExtraPreviewImage(input: unknown): ExtraPreviewImage | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const value = input as Record<string, unknown>
  if (value.mimeType !== 'image/jpeg') return null
  if (typeof value.base64 !== 'string' || !value.base64) return null
  return {mimeType: 'image/jpeg', base64: value.base64}
}

function hasImageField(value: Record<string, unknown>): boolean {
  return IMAGE_FIELDS.some((field) => typeof value[field] === 'string' && value[field] !== '')
}

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

  const preview = Object.fromEntries(STRING_FIELDS.map((field) => [field, value[field]])) as ExtraExtraPreview

  if (!hasImageField(value)) return preview

  if (!validateExtraImageBrief(value)) return null

  return {
    ...preview,
    imageShotType: value.imageShotType as string,
    imageCaption: value.imageCaption as string,
    imagePrompt: value.imagePrompt as string,
  }
}
