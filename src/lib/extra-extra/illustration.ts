import type {ExtraExtra} from '@/lib/sanity/types'

export function extraIllustration(
  extra: ExtraExtra,
): {url: string; caption: string} | null {
  const url = extra.imageUrl
  const caption = extra.imageCaption
  if (typeof url !== 'string' || url.length === 0) return null
  if (typeof caption !== 'string' || caption.length === 0) return null
  return {url, caption}
}
