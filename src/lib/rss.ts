import {hasExtraExtra} from '@/lib/extra-extra/has-extra'
import {extraExtraPath} from '@/lib/extra-extra/path'
import type {Alarm, ExtraExtra} from '@/lib/sanity/types'
import {alarmPath, alarmSlugOrFallback} from '@/lib/select/alarm-path'
import {parseIsoDateAtNoonUtc} from '@/lib/select/stockholm-date'

export const RSS_FEED_PATH = '/rss.xml'
export const RSS_ITEM_LIMIT = 50

export type RssItem = {
  date: string
  kicker: string
  headline: string
  body: string
  path?: string
}

export function rssItemsFromAlarms(alarms: Alarm[], extras: ExtraExtra[] = []): RssItem[] {
  const extraByDate = new Map(
    extras.filter(hasExtraExtra).map((extra) => [extra.date, extra]),
  )
  const dates = [...new Set([...alarms.map((alarm) => alarm.date), ...extraByDate.keys()])]
    .sort()
    .reverse()

  return dates.flatMap((date) => {
    const items: RssItem[] = []
    const extra = extraByDate.get(date)
    if (extra) {
      items.push({
        date: extra.date,
        kicker: extra.kicker,
        headline: extra.headline,
        body: extra.body,
        path: extraExtraPath(extra.date),
      })
    }

    const dayAlarms = alarms
      .filter((alarm) => alarm.date === date)
      .sort((a, b) => (a.slot ?? 1) - (b.slot ?? 1))
    for (const alarm of dayAlarms) {
      items.push({
        date: alarm.date,
        kicker: alarm.kicker,
        headline: alarm.headline,
        body: alarm.body,
        path: alarmPath(alarm.date, alarmSlugOrFallback(alarm.headline, alarm.slug)),
      })
    }

    return items
  })
}

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function rssPubDate(date: string): string {
  return parseIsoDateAtNoonUtc(date).toUTCString()
}

function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`
}

function itemDescription(item: RssItem): string {
  const paragraphs = item.body.split('\n\n').filter(Boolean)
  return [item.kicker, ...paragraphs].join('\n\n')
}

export function buildRss(input: {
  title: string
  description: string
  siteUrl: string
  feedUrl: string
  items: RssItem[]
}): string {
  const items = input.items
    .map((item) => {
      const path = item.path ?? `/arkiv/${item.date}`
      const link = `${input.siteUrl}${path}`
      return `    <item>
      <title>${escapeXml(item.headline)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${rssPubDate(item.date)}</pubDate>
      <description>${cdata(itemDescription(item))}</description>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(input.title)}</title>
    <link>${escapeXml(input.siteUrl)}</link>
    <description>${escapeXml(input.description)}</description>
    <language>sv</language>
    <atom:link href="${escapeXml(input.feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`
}
