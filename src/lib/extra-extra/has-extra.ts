import type {ExtraExtra} from '@/lib/sanity/types'

export function hasExtraExtra(extra?: ExtraExtra | null): extra is ExtraExtra {
  return (
    typeof extra?.headline === 'string' &&
    extra.headline.length > 0 &&
    typeof extra.body === 'string' &&
    extra.body.length > 0
  )
}
