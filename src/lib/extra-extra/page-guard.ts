import {hasExtraExtra} from '@/lib/extra-extra/has-extra'
import type {ExtraExtra} from '@/lib/sanity/types'
import {isIsoDateString} from '@/lib/select/stockholm-date'

export function canShowExtraExtraPage(
  date: string,
  extra: ExtraExtra | null,
): extra is ExtraExtra {
  return isIsoDateString(date) && hasExtraExtra(extra)
}
