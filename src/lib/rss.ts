import {hasExtraExtra} from '@/lib/extra-extra/has-extra'
import type {Alarm} from '@/lib/sanity/types'
import {parseIsoDateAtNoonUtc} from '@/lib/select/stockholm-date'

export const RSS_FEED_PATH = '/rss.xml'
export const RSS_ITEM_LIMIT = 50

export type RssItem = {
  date: string
  kicker: string
  headline: string
  body: string
  pathSuffix?: string
}

export function rssItemsFromAlarms(alarms: Alarm[]): RssItem[] {
  return alarms.flatMap((alarm) => {
    const lead: RssItem = {
      date: alarm.date,
      kicker: alarm.kicker,
      headline: alarm.headline,
      body: alarm.body,
    }

    if (!hasExtraExtra(alarm)) return [lead]

    return [
      lead,
      {
        date: alarm.date,
        kicker: alarm.extraExtra.kicker,
        headline: alarm.extraExtra.headline,
        body: alarm.extraExtra.body,
        pathSuffix: '#extra-extra',
      },
    ]
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
      const link = `${input.siteUrl}/arkiv/${item.date}${item.pathSuffix ?? ''}`
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
