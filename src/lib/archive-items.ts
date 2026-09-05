import {EXTRA_EXTRA_STAMP} from '@/lib/copy'
import {extraExtraPath} from '@/lib/extra-extra/path'
import type {AlarmTeaser, ArchiveItem} from '@/lib/sanity/types'

export type ExtraArchiveRow = {
  _id: string
  date: string
  headline: string
  body: string
}

export function mixArchiveItems(
  alarms: AlarmTeaser[],
  extras: ExtraArchiveRow[],
): ArchiveItem[] {
  const extraRows: ArchiveItem[] = extras
    .filter(
      (extra) => extra.headline.length > 0 && extra.body.length > 0,
    )
    .map((extra) => ({
      _id: extra._id,
      date: extra.date,
      kicker: EXTRA_EXTRA_STAMP,
      headline: extra.headline,
      href: extraExtraPath(extra.date),
      kind: 'extraExtra',
    }))
  const alarmRows: ArchiveItem[] = alarms.map((alarm) => ({
    ...alarm,
    href: `/arkiv/${alarm.date}`,
    kind: 'alarm',
  }))
  return [...extraRows, ...alarmRows].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    if (a.kind !== b.kind) return a.kind === 'extraExtra' ? -1 : 1
    return a._id.localeCompare(b._id)
  })
}
