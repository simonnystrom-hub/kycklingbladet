import {parseExtraImageShotType, validateExtraImageBrief, type ExtraImageBrief} from '@/lib/generate/extra-image'
import type {ExtraExtraPreview} from './payload'

export function briefFromPreview(preview: ExtraExtraPreview, shotType: unknown): ExtraImageBrief | null {
  const brief = validateExtraImageBrief(preview)
  if (!brief) return null

  const override = parseExtraImageShotType(shotType)
  if (!override) return brief

  return {...brief, shotType: override}
}
