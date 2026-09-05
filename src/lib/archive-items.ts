import {EXTRA_EXTRA_STAMP} from '@/lib/copy'
import {extraExtraPath} from '@/lib/extra-extra/path'
import {alarmPath, alarmSlugOrFallback} from '@/lib/select/alarm-path'
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
    href: alarmPath(alarm.date, alarmSlugOrFallback(alarm.headline, alarm.slug)),
    kind: 'alarm',
  }))
  return [...extraRows, ...alarmRows].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    if (a.kind !== b.kind) return a.kind === 'extraExtra' ? -1 : 1
    const slotA = a.kind === 'alarm' ? (a.slot ?? 1) : 0
    const slotB = b.kind === 'alarm' ? (b.slot ?? 1) : 0
    if (slotA !== slotB) return slotA - slotB
    return a._id.localeCompare(b._id)
  })
}
