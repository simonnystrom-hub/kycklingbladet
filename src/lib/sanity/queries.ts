import {ARCHIVE_PAGE_SIZE, archivePageWindow} from '@/lib/nav'
import {RSS_ITEM_LIMIT} from '@/lib/rss'
import {getSanityClient, isKycklingbladetConfigured} from './client'
import type {Alarm, AlarmTeaser, SiteSettings} from './types'

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
  modelVersion
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
