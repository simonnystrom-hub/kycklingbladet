import {alarmIdForDate, parseAlarmSlot, shouldCreateAlarm} from '@/lib/select/alarm-id'
import {alarmSlugOrFallback, uniqueAlarmSlug} from '@/lib/select/alarm-path'
import type {GeneratedAlarm} from '@/lib/generate/validate'
import {
  recentLeadWindow,
  type ScoredHeadline,
  type UsedLeadSource,
} from '@/lib/select/select-winner'
import {alarmindexDayUrl} from '@/lib/alarmindex/url'
import {getWriteClient} from './write-client'

export type PublishedAlarmSlot = {
  _id: string
  date: string
  headline: string
  slot?: number | null
  slug?: string | null
  sourceHeadline: string
  sourceNewspaperSlug: string
  sourceHeadlineId?: string | null
  notices?: {
    sourceHeadline: string
    sourceNewspaper: string
    sourceNewspaperSlug: string
    sourceAlarmindexUrl: string
    sourceScore: number
    sourceHeadlineId: string
  }[] | null
}

export async function findExistingAlarmId(
  date: string,
  slot: number = 1,
): Promise<string | null> {
  const client = getWriteClient()
  const id = alarmIdForDate(date, slot)
  const found = await client.fetch<string | null>(
    `*[_id in [$id, $draftId]][0]._id`,
    {id, draftId: `drafts.${id}`},
  )
  return found
}

export async function fetchAlarmsForDate(date: string): Promise<PublishedAlarmSlot[]> {
  return getWriteClient().fetch(
    `*[_type == "alarm" && date == $date && !(_id in path("drafts.**"))] | order(coalesce(slot, 1) asc){
      _id, date, headline, slot, slug, sourceHeadline, sourceNewspaperSlug, sourceHeadlineId,
      notices[]{sourceHeadline, sourceNewspaper, sourceNewspaperSlug, sourceAlarmindexUrl, sourceScore, sourceHeadlineId}
    }`,
    {date},
  )
}

export function takenSlugs(alarms: PublishedAlarmSlot[]): string[] {
  return alarms.map((alarm) => alarmSlugOrFallback(alarm.headline, alarm.slug))
}

export function alarmBySlot(
  alarms: PublishedAlarmSlot[],
  slot: number,
): PublishedAlarmSlot | undefined {
  return alarms.find((alarm) => parseAlarmSlot(alarm.slot) === slot)
}

export async function fetchRecentLeadSources(beforeDate: string): Promise<UsedLeadSource[]> {
  const {start, before} = recentLeadWindow(beforeDate)
  const rows = await getWriteClient().fetch<
    {
      sourceHeadline?: string | null
      sourceNewspaperSlug?: string | null
      sourceHeadlineId?: string | null
    }[]
  >(
    `*[_type == "alarm" && date >= $start && date < $before]{sourceHeadline, sourceNewspaperSlug, sourceHeadlineId}`,
    {start, before},
  )
  return rows.flatMap((row) => {
    if (typeof row.sourceHeadline !== 'string' || typeof row.sourceNewspaperSlug !== 'string') {
      return []
    }
    return [
      {
        sourceHeadline: row.sourceHeadline,
        sourceNewspaperSlug: row.sourceNewspaperSlug,
        sourceHeadlineId: typeof row.sourceHeadlineId === 'string' ? row.sourceHeadlineId : null,
      },
    ]
  })
}

export async function publishAlarm(input: {
  date: string
  generated: GeneratedAlarm
  source: ScoredHeadline
  promptVersion: string
  modelVersion: string
  slot?: number
  slug?: string
}): Promise<'created' | 'skipped'> {
  const slot = parseAlarmSlot(input.slot)
  const existing = await findExistingAlarmId(input.date, slot)
  if (!shouldCreateAlarm(existing)) return 'skipped'
  const id = alarmIdForDate(input.date, slot)
  const slug = input.slug ?? uniqueAlarmSlug(input.generated.headline, [])
  await getWriteClient().create({
    _id: id,
    _type: 'alarm',
    date: input.date,
    slot,
    slug,
    kicker: input.generated.kicker,
    headline: input.generated.headline,
    body: input.generated.body,
    expertVoice: input.generated.expertVoice,
    expertHeadline: input.generated.expertHeadline,
    expertText: input.generated.expertText,
    sourceHeadline: input.source.text,
    sourceHeadlineId: input.source.headlineId,
    sourceNewspaper: input.source.newspaperName,
    sourceNewspaperSlug: input.source.newspaperSlug,
    sourceAlarmindexUrl: alarmindexDayUrl(input.date, input.source.newspaperSlug),
    sourceScore: input.source.displayScore,
    promptVersion: input.promptVersion,
    modelVersion: input.modelVersion,
  })
  return 'created'
}

export async function ensureAlarmSlug(alarm: PublishedAlarmSlot, taken: string[]): Promise<string> {
  const stored = alarm.slug?.trim()
  if (stored) return stored
  if (alarm._id.startsWith('drafts.')) {
    return uniqueAlarmSlug(alarm.headline, taken)
  }
  const slug = uniqueAlarmSlug(
    alarm.headline,
    taken.filter((value) => value !== alarmSlugOrFallback(alarm.headline, null)),
  )
  await getWriteClient()
    .patch(alarm._id)
    .set({slug, slot: parseAlarmSlot(alarm.slot)})
    .commit()
  return slug
}

export async function unsetAlarmNotices(id: string): Promise<void> {
  await getWriteClient().patch(id.replace(/^drafts\./, '')).unset(['notices']).commit()
}
