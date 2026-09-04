import {fetchScoredHeadlines} from '@/lib/alarmindex/queries'
import {alarmindexDayUrl} from '@/lib/alarmindex/url'
import {generateNotice, pickNoticeHeadlineIds} from '@/lib/generate/claude-notices'
import {NOTICE_COUNT, remainingHeadlines} from '@/lib/select/notice-picks'
import {alarmIdForDate} from '@/lib/select/alarm-id'
import type {AlarmNotice} from './types'
import {getWriteClient} from './write-client'

export type FillNoticesResult = 'skipped' | 'empty' | 'filled'

type StoredAlarm = {
  _id: string
  date: string
  sourceHeadline: string
  sourceNewspaperSlug: string
  sourceHeadlineId?: string | null
  notices?: AlarmNotice[] | null
}

function noticeKey(headlineId: string, index: number): string {
  const cleaned = headlineId.replace(/[^a-zA-Z0-9_-]/g, '').slice(-24)
  return `n${index}-${cleaned || 'notice'}`
}

function asNoticeDoc(notice: AlarmNotice, index: number) {
  return {
    _type: 'notice',
    _key: notice._key || noticeKey(notice.sourceHeadlineId, index),
    headline: notice.headline,
    body: notice.body,
    sourceHeadline: notice.sourceHeadline,
    sourceNewspaper: notice.sourceNewspaper,
    sourceNewspaperSlug: notice.sourceNewspaperSlug,
    sourceAlarmindexUrl: notice.sourceAlarmindexUrl,
    sourceScore: notice.sourceScore,
    sourceHeadlineId: notice.sourceHeadlineId,
  }
}

export async function fetchAlarmsNeedingNotices(): Promise<StoredAlarm[]> {
  return getWriteClient().fetch(
    `*[_type == "alarm" && (!defined(notices) || count(notices) < ${NOTICE_COUNT})] | order(date asc){
      _id, date, sourceHeadline, sourceNewspaperSlug, sourceHeadlineId,
      notices[]{_key, headline, body, sourceHeadline, sourceNewspaper, sourceNewspaperSlug, sourceAlarmindexUrl, sourceScore, sourceHeadlineId}
    }`,
  )
}

async function fetchAlarmForFill(date: string): Promise<StoredAlarm | null> {
  const id = alarmIdForDate(date)
  return getWriteClient().fetch(
    `*[_id in [$id, $draftId]][0]{
      _id, date, sourceHeadline, sourceNewspaperSlug, sourceHeadlineId,
      notices[]{_key, headline, body, sourceHeadline, sourceNewspaper, sourceNewspaperSlug, sourceAlarmindexUrl, sourceScore, sourceHeadlineId}
    }`,
    {id, draftId: `drafts.${id}`},
  )
}

export async function fetchAlarmsWithNotices(): Promise<StoredAlarm[]> {
  return getWriteClient().fetch(
    `*[_type == "alarm" && count(notices) > 0] | order(date asc){
      _id, date, sourceHeadline, sourceNewspaperSlug, sourceHeadlineId,
      notices[]{_key, headline, body, sourceHeadline, sourceNewspaper, sourceNewspaperSlug, sourceAlarmindexUrl, sourceScore, sourceHeadlineId}
    }`,
  )
}

export async function rewriteNoticesForDate(date: string): Promise<number> {
  const alarm = await fetchAlarmForFill(date)
  if (!alarm) throw new Error(`Inget larm för ${date}`)
  const existing = alarm.notices ?? []
  if (existing.length === 0) return 0

  const rewritten: AlarmNotice[] = []
  for (const notice of existing) {
    try {
      const generated = await generateNotice({
        text: notice.sourceHeadline,
        newspaperName: notice.sourceNewspaper,
      })
      rewritten.push({
        ...notice,
        headline: generated.headline,
        body: generated.body,
      })
    } catch (error) {
      console.error(`Kunde inte skriva om notis för ${date}`, error)
      rewritten.push(notice)
    }
  }

  await getWriteClient()
    .patch(alarm._id.replace(/^drafts\./, ''))
    .set({notices: rewritten.map((notice, index) => asNoticeDoc(notice, index))})
    .commit()
  return rewritten.length
}

export async function fillNoticesForDate(date: string): Promise<FillNoticesResult> {
  const alarm = await fetchAlarmForFill(date)
  if (!alarm) throw new Error(`Inget larm för ${date}`)
  const existing = alarm.notices ?? []
  if (existing.length >= NOTICE_COUNT) return 'skipped'

  const headlines = await fetchScoredHeadlines(date)
  const pool = remainingHeadlines(headlines, alarm, existing)
  const needed = NOTICE_COUNT - existing.length
  if (pool.length === 0 || needed <= 0) return existing.length > 0 ? 'skipped' : 'empty'

  const ids = await pickNoticeHeadlineIds(pool, Math.min(needed, pool.length))
  if (ids.length === 0) return existing.length > 0 ? 'skipped' : 'empty'

  const added: AlarmNotice[] = []
  for (const headlineId of ids) {
    const source = pool.find((headline) => headline.headlineId === headlineId)
    if (!source) continue
    try {
      const generated = await generateNotice({
        text: source.text,
        newspaperName: source.newspaperName,
      })
      added.push({
        headline: generated.headline,
        body: generated.body,
        sourceHeadline: source.text,
        sourceNewspaper: source.newspaperName,
        sourceNewspaperSlug: source.newspaperSlug,
        sourceAlarmindexUrl: alarmindexDayUrl(date, source.newspaperSlug),
        sourceScore: source.displayScore,
        sourceHeadlineId: source.headlineId,
      })
    } catch (error) {
      console.error(`Kunde inte skriva notis ${headlineId} för ${date}`, error)
    }
  }

  if (added.length === 0) return existing.length > 0 ? 'skipped' : 'empty'

  const notices = [...existing, ...added].map((notice, index) => asNoticeDoc(notice, index))

  await getWriteClient()
    .patch(alarm._id.replace(/^drafts\./, ''))
    .set({notices})
    .commit()
  return 'filled'
}
