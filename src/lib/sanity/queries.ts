import {ARCHIVE_PAGE_SIZE, archivePageWindow} from '@/lib/nav'
import {mixArchiveItems} from '@/lib/archive-items'
import {RSS_ITEM_LIMIT} from '@/lib/rss'
import {WEEK_LEAD_COUNT, weekLeadStart} from '@/lib/week-leads'
import {alarmPath, alarmSlugOrFallback, decodeAlarmSlug} from '@/lib/select/alarm-path'
import {getSanityClient, isKycklingbladetConfigured} from './client'
import type {Alarm, AlarmTeaser, ArchiveItem, ExtraExtra, SiteSettings} from './types'

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
  slot,
  slug,
  notices[]{
    headline,
    body,
    sourceHeadline,
    sourceNewspaper,
    sourceNewspaperSlug,
    sourceAlarmindexUrl,
    sourceScore,
    sourceHeadlineId
  },
  "imageUrl": image.asset->url,
  imageCaption
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
  return safeFetchOne(
    `*[_type == "alarm" && coalesce(slot, 1) == 1] | order(date desc)[0]${alarmFields}`,
  )
}

export async function getAlarmsByDate(date: string): Promise<Alarm[]> {
  return safeFetchMany(
    `*[_type == "alarm" && date == $date] | order(coalesce(slot, 1) asc)${alarmFields}`,
    {date},
  )
}

export async function getAlarmByDate(date: string): Promise<Alarm | null> {
  return safeFetchOne(
    `*[_type == "alarm" && date == $date && coalesce(slot, 1) == 1][0]${alarmFields}`,
    {date},
  )
}

export async function getAlarmByDateAndSlug(date: string, slug: string): Promise<Alarm | null> {
  const alarms = await getAlarmsByDate(date)
  const wanted = decodeAlarmSlug(slug)
  return (
    alarms.find((alarm) => decodeAlarmSlug(alarmSlugOrFallback(alarm.headline, alarm.slug)) === wanted) ??
    null
  )
}

export async function getAlarmArchive(): Promise<AlarmTeaser[]> {
  return safeFetchMany(
    `*[_type == "alarm"] | order(date desc, coalesce(slot, 1) asc){ _id, date, kicker, headline, slug, slot }`,
  )
}

export async function getAlarmsForFeed(): Promise<Alarm[]> {
  return safeFetchMany(
    `*[_type == "alarm"] | order(date desc, coalesce(slot, 1) asc)[0...${RSS_ITEM_LIMIT}]${alarmFields}`,
  )
}

export async function getExtraByDate(date: string): Promise<ExtraExtra | null> {
  return safeFetchOne(`*[_type == "extraExtra" && date == $date][0]${extraExtraFields}`, {date})
}

export async function getExtrasByDates(dates: string[]): Promise<ExtraExtra[]> {
  if (dates.length === 0) return []
  return safeFetchMany(`*[_type == "extraExtra" && date in $dates]${extraExtraFields}`, {dates})
}

export async function getExtraArchive(): Promise<
  {_id: string; date: string; headline: string; body: string}[]
> {
  return safeFetchMany(
    `*[_type == "extraExtra"] | order(date desc){ _id, date, headline, body }`,
  )
}

export async function getArchivePage(page: number): Promise<{
  items: ArchiveItem[]
  page: number
  pageCount: number
}> {
  const [alarms, extras] = await Promise.all([getAlarmArchive(), getExtraArchive()])
  const archive = mixArchiveItems(alarms, extras)
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
  const dates = [...new Set(archive.filter((alarm) => (alarm.slot ?? 1) === 1).map((alarm) => alarm.date))]
  const index = dates.indexOf(date)
  if (index === -1) {
    return {previous: null, next: null}
  }

  return {
    previous: dates[index + 1] ?? null,
    next: dates[index - 1] ?? null,
  }
}

export async function getAdjacentLarm(
  date: string,
  slug: string,
): Promise<{previous: string | null; next: string | null}> {
  const archive = await getAlarmArchive()
  const hrefs = archive.map((alarm) =>
    alarmPath(alarm.date, alarmSlugOrFallback(alarm.headline, alarm.slug)),
  )
  const index = hrefs.indexOf(alarmPath(date, slug))
  if (index === -1) {
    return {previous: null, next: null}
  }
  return {
    previous: hrefs[index + 1] ?? null,
    next: hrefs[index - 1] ?? null,
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
    `*[_type == "alarm" && coalesce(slot, 1) == 1 && date >= $start && date < $today && date != $shownDate && defined(humorScore)] | order(humorScore desc, date desc)[0...${WEEK_LEAD_COUNT}]{ _id, date, kicker, headline, slug, slot }`,
    {start: weekLeadStart(today), today, shownDate: shownDate ?? today},
  )
}
