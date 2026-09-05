import type {Alarm, ExtraExtra} from '@/lib/sanity/types'

export function cartoonIllustration(doc: {
  imageUrl?: string | null
  imageCaption?: string | null
}): {url: string; caption: string} | null {
  const url = doc.imageUrl
  const caption = doc.imageCaption
  if (typeof url !== 'string' || url.length === 0) return null
  if (typeof caption !== 'string' || caption.length === 0) return null
  return {url, caption}
}

export function extraIllustration(extra: ExtraExtra) {
  return cartoonIllustration(extra)
}

export function leadIllustration(alarm: Alarm) {
  return cartoonIllustration(alarm)
}
