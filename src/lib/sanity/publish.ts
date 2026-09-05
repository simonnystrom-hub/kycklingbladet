import {alarmIdForDate, shouldCreateAlarm} from '@/lib/select/alarm-id'
import type {GeneratedAlarm} from '@/lib/generate/validate'
import {
  recentLeadWindow,
  type ScoredHeadline,
  type UsedLeadSource,
} from '@/lib/select/select-winner'
import {alarmindexDayUrl} from '@/lib/alarmindex/url'
import {getWriteClient} from './write-client'

export async function findExistingAlarmId(date: string): Promise<string | null> {
  const client = getWriteClient()
  const id = alarmIdForDate(date)
  const found = await client.fetch<string | null>(
    `*[_id in [$id, $draftId]][0]._id`,
    {id, draftId: `drafts.${id}`},
  )
  return found
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
}): Promise<'created' | 'skipped'> {
  const existing = await findExistingAlarmId(input.date)
  if (!shouldCreateAlarm(existing)) return 'skipped'
  const id = alarmIdForDate(input.date)
  await getWriteClient().create({
    _id: id,
    _type: 'alarm',
    date: input.date,
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
