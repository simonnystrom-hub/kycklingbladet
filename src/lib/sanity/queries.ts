import {ARCHIVE_PAGE_SIZE, archivePageWindow} from '@/lib/nav'
import {RSS_ITEM_LIMIT} from '@/lib/rss'
import {WEEK_LEAD_COUNT, weekLeadStart} from '@/lib/week-leads'
import {getSanityClient, isKycklingbladetConfigured} from './client'
import type {Alarm, AlarmTeaser, ExtraExtra, SiteSettings} from './types'

const alarmFields = `{
  _id,
  date,
  kicker,
  headline,
  body,
  expertVoice,
  expertHeadline,
  expertText,
  sourceHeadline,
  sourceNewspaper,
  sourceNewspaperSlug,
  sourceAlarmindexUrl,
  sourceScore,
  promptVersion,
  modelVersion,
  humorScore,
  notices[]{
    headline,
    body,
    sourceHeadline,
    sourceNewspaper,
    sourceNewspaperSlug,
    sourceAlarmindexUrl,
    sourceScore,
    sourceHeadlineId
  }
}`

const extraExtraFields = `{
  _id,
  date,
  kicker,
  headline,
  body,
  sourceUrl,
  sourceHeadline,
  sourceNewspaper,
  sourceNewspaperSlug,
  promptVersion,
  modelVersion,
  createdAt,
  "imageUrl": image.asset->url,
  imageCaption
}`

async function safeFetchOne<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T | null> {
  if (!isKycklingbladetConfigured()) {
    return null
  }

  try {
    return await getSanityClient().fetch<T | null>(query, params)
  } catch {
    return null
  }
}

async function safeFetchMany<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  if (!isKycklingbladetConfigured()) {
    return []
  }

  try {
    return await getSanityClient().fetch<T[]>(query, params)
  } catch {
    return []
  }
}

export async function getLatestAlarm(): Promise<Alarm | null> {
  return safeFetchOne(`*[_type == "alarm"] | order(date desc)[0]${alarmFields}`)
}

export async function getAlarmByDate(date: string): Promise<Alarm | null> {
  return safeFetchOne(`*[_type == "alarm" && date == $date][0]${alarmFields}`, {date})
}

export async function getAlarmArchive(): Promise<AlarmTeaser[]> {
  return safeFetchMany(
    `*[_type == "alarm"] | order(date desc){ _id, date, kicker, headline }`,
  )
}

export async function getAlarmsForFeed(): Promise<Alarm[]> {
  return safeFetchMany(
    `*[_type == "alarm"] | order(date desc)[0...${RSS_ITEM_LIMIT}]${alarmFields}`,
  )
}

export async function getExtraByDate(date: string): Promise<ExtraExtra | null> {
  return safeFetchOne(`*[_type == "extraExtra" && date == $date][0]${extraExtraFields}`, {date})
}

export async function getExtrasByDates(dates: string[]): Promise<ExtraExtra[]> {
  if (dates.length === 0) return []
  return safeFetchMany(`*[_type == "extraExtra" && date in $dates]${extraExtraFields}`, {dates})
}

export async function getAlarmArchivePage(page: number): Promise<{
  items: AlarmTeaser[]
  page: number
  pageCount: number
}> {
  const archive = await getAlarmArchive()
  const {current, pageCount, start} = archivePageWindow(archive.length, page)
  return {
    items: archive.slice(start, start + ARCHIVE_PAGE_SIZE),
    page: current,
    pageCount,
  }
}

export async function getAdjacentDates(
  date: string,
): Promise<{previous: string | null; next: string | null}> {
  const archive = await getAlarmArchive()
  const dates = archive.map((alarm) => alarm.date)
  const index = dates.indexOf(date)
  if (index === -1) {
    return {previous: null, next: null}
  }

  // Archive is date desc: index+1 is older (previous), index-1 is newer (next).
  return {
    previous: dates[index + 1] ?? null,
    next: dates[index - 1] ?? null,
  }
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return safeFetchOne(
    `*[_id == "siteSettings"][0]{ title, tagline, about, alarmindexMention }`,
  )
}

export async function getWeekLeads(
  today: string,
  shownDate: string | null,
): Promise<AlarmTeaser[]> {
  return safeFetchMany(
    `*[_type == "alarm" && date >= $start && date < $today && date != $shownDate && defined(humorScore)] | order(humorScore desc, date desc)[0...${WEEK_LEAD_COUNT}]{ _id, date, kicker, headline }`,
    {start: weekLeadStart(today), today, shownDate: shownDate ?? today},
  )
}
