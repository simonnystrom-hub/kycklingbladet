import {TAGLINE} from '@/lib/copy'
import {buildRss, RSS_FEED_PATH, rssItemsFromAlarms} from '@/lib/rss'
import {getAlarmsForFeed, getExtrasByDates, getSiteSettings} from '@/lib/sanity/queries'
import {stockholmToday} from '@/lib/select/stockholm-date'
import {absoluteUrl, getSiteUrl} from '@/lib/site-url'

export const revalidate = 60

export async function GET() {
  const [alarms, settings] = await Promise.all([
    getAlarmsForFeed(),
    getSiteSettings(),
  ])
  const extraDates = [...new Set([...alarms.map((alarm) => alarm.date), stockholmToday()])]
  const extras = await getExtrasByDates(extraDates)
  const siteUrl = getSiteUrl()
  const xml = buildRss({
    title: settings?.title?.trim() || 'Kycklingbladet',
    description: settings?.tagline?.trim() || TAGLINE,
    siteUrl,
    feedUrl: absoluteUrl(RSS_FEED_PATH),
    items: rssItemsFromAlarms(alarms, extras),
  })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    },
  })
}
