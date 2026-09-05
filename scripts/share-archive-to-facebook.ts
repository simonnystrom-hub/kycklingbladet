import {extraExtraPath} from '../src/lib/extra-extra/path'
import {hasExtraExtra} from '../src/lib/extra-extra/has-extra'
import {
  facebookExtraMessage,
  facebookLeadMessage,
  type FacebookLeadCopy,
} from '../src/lib/facebook/message'
import {facebookConfig, shareToFacebook} from '../src/lib/facebook/share'
import {getSanityClient} from '../src/lib/sanity/client'
import type {ExtraExtra} from '../src/lib/sanity/types'
import {absoluteUrl} from '../src/lib/site-url'

const GAP_MS = 4000

type LeadRow = FacebookLeadCopy & {
  date: string
  imageUrl?: string | null
}

type QueueItem =
  | {kind: 'alarm'; date: string; lead: LeadRow}
  | {kind: 'extra'; date: string; extra: ExtraExtra}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadQueue(): Promise<QueueItem[]> {
  const client = getSanityClient()
  const [leads, extras] = await Promise.all([
    client.fetch<LeadRow[]>(
      `*[_type == "alarm" && defined(headline) && defined(body)] | order(date asc){
        date, headline, body, expertVoice, expertHeadline, expertText, imageCaption,
        "imageUrl": image.asset->url,
        notices[]{headline, body}
      }`,
    ),
    client.fetch<ExtraExtra[]>(
      `*[_type == "extraExtra"] | order(date asc){
        date, kicker, headline, body, imageCaption,
        "imageUrl": image.asset->url,
        sourceUrl, sourceHeadline, sourceNewspaper, sourceNewspaperSlug,
        promptVersion, modelVersion, createdAt, _id
      }`,
    ),
  ])

  const items: QueueItem[] = [
    ...leads
      .filter((lead) => lead.headline?.trim() && lead.body?.trim() && lead.date)
      .map((lead) => ({kind: 'alarm' as const, date: lead.date, lead})),
    ...extras.filter(hasExtraExtra).map((extra) => ({
      kind: 'extra' as const,
      date: extra.date,
      extra,
    })),
  ]

  items.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    if (a.kind === b.kind) return 0
    return a.kind === 'alarm' ? -1 : 1
  })
  return items
}

async function postItem(item: QueueItem) {
  if (item.kind === 'alarm') {
    return shareToFacebook({
      message: facebookLeadMessage(item.lead),
      imageUrl: item.lead.imageUrl,
      articleUrl: absoluteUrl(`/arkiv/${item.date}`),
    })
  }
  return shareToFacebook({
    message: facebookExtraMessage(item.extra),
    imageUrl: item.extra.imageUrl,
    articleUrl: absoluteUrl(extraExtraPath(item.date)),
  })
}

async function main() {
  const queue = await loadQueue()
  console.log(`Kö: ${queue.length} inlägg, äldst först (larm före Extra Extra samma dag).`)
  if (process.env.FACEBOOK_DRY_RUN === '1') {
    for (const item of queue) {
      console.log(`${item.date} ${item.kind === 'alarm' ? 'larm' : 'extra extra'}`)
    }
    return
  }

  if (!facebookConfig()) {
    throw new Error('FACEBOOK_PAGE_ID eller FACEBOOK_PAGE_ACCESS_TOKEN saknas')
  }

  let shared = 0
  let failed = 0
  let skipped = 0

  for (const [index, item] of queue.entries()) {
    const label = item.kind === 'alarm' ? 'larm' : 'extra extra'
    const result = await postItem(item)
    if (result === 'shared') shared += 1
    else if (result === 'failed') failed += 1
    else skipped += 1
    console.log(`${index + 1}/${queue.length} ${item.date} ${label}: ${result}`)
    if (index < queue.length - 1) await sleep(GAP_MS)
  }

  console.log(`Klart. shared=${shared} failed=${failed} skipped=${skipped}`)
  if (failed > 0 || skipped > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
