export const EXTRA_IMAGE_SHOT_TYPES = ['intervju', 'incident', 'annat'] as const
export type ExtraImageShotType = (typeof EXTRA_IMAGE_SHOT_TYPES)[number]

export type ExtraImageBrief = {
  shotType: ExtraImageShotType
  caption: string
  scenePrompt: string
}

export function parseExtraImageShotType(value: unknown): ExtraImageShotType | null {
  if (value === 'intervju' || value === 'incident' || value === 'annat') return value
  return null
}

export function validateExtraImageBrief(input: unknown): ExtraImageBrief | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const record = input as Record<string, unknown>
  const shotType = parseExtraImageShotType(record.imageShotType)
  const caption = typeof record.imageCaption === 'string' ? record.imageCaption.trim() : ''
  const scenePrompt = typeof record.imagePrompt === 'string' ? record.imagePrompt.trim() : ''
  if (!shotType || !caption || !scenePrompt) return null
  return {shotType, caption, scenePrompt}
}

export const EXTRA_IMAGE_SIGNATURE = 'Kycklingbladet.com'

export const EXTRA_IMAGE_STYLE = `STYLE (always, never vary):
Single-panel newspaper cartoon in the manner of Jan Berglin and Gary Larson (The Far Side).
MONOCHROME ONLY — black, white, grey. No colour.
Simple ink drawing, few details, flat shapes. Not a photograph, not a painting, not photorealistic.
Actors: hens and roosters only, anthropomorphic as farmyard characters.
NO HUMANS, no human hands, no photorealistic faces.
SIGNATURE (always, never vary): in one bottom corner, a tiny loose ink cartoonist signature in Far Side handwriting. The letters must be exactly "${EXTRA_IMAGE_SIGNATURE}". Never sign Larson, Gary Larson, Berglin, Jan Berglin, Far Side, The Far Side, or any other person or studio name.
NO OTHER TEXT in the image: no letters, signs, logos, captions, or speech bubbles besides that one signature.
Aspect 3:4 portrait. One clear scene.`

export function buildGeminiImagePrompt(brief: ExtraImageBrief): string {
  return `${EXTRA_IMAGE_STYLE}

SHOT TYPE: ${brief.shotType}
SCENE: ${brief.scenePrompt}`
}
