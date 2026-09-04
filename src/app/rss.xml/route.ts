import {TAGLINE} from '@/lib/copy'
import {buildRss, RSS_FEED_PATH} from '@/lib/rss'
import {getAlarmsForFeed, getSiteSettings} from '@/lib/sanity/queries'
import {absoluteUrl, getSiteUrl} from '@/lib/site-url'

export const revalidate = 60

export async function GET() {
  const [items, settings] = await Promise.all([getAlarmsForFeed(), getSiteSettings()])
  const siteUrl = getSiteUrl()
  const xml = buildRss({
    title: settings?.title?.trim() || 'Kycklingbladet',
    description: settings?.tagline?.trim() || TAGLINE,
    siteUrl,
    feedUrl: absoluteUrl(RSS_FEED_PATH),
    items,
  })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    },
  })
}
