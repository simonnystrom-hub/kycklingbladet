import {TAGLINE} from '@/lib/copy'

export const DEFAULT_OG_IMAGE_PATH = '/og-default.png'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const DEFAULT_OG_IMAGE = {
  url: DEFAULT_OG_IMAGE_PATH,
  width: OG_IMAGE_WIDTH,
  height: OG_IMAGE_HEIGHT,
  alt: `Kycklingbladet — ${TAGLINE}`,
}

export function cartoonImageUrl(
  doc?: {imageUrl?: string | null} | null,
): string | undefined {
  const url = doc?.imageUrl?.trim()
  return url ? url : undefined
}

export function shareImages(
  ...cartoonUrls: Array<string | null | undefined>
) {
  const extras = cartoonUrls.filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
  )
  return [DEFAULT_OG_IMAGE, ...extras.map((url) => ({url}))]
}
