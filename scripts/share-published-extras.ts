import {extraExtraItemPath} from '../src/lib/extra-extra/path'
import {facebookExtraMessage} from '../src/lib/facebook/message'
import {shareToFacebook} from '../src/lib/facebook/share'
import {getSanityClient} from '../src/lib/sanity/client'
import {absoluteUrl} from '../src/lib/site-url'

const GAP_MS = 4000
const ids = process.argv.slice(2).map((id) => id.trim()).filter(Boolean)
if (ids.length === 0) {
  console.error('Ange minst ett Extra Extra-id, t.ex. extra-extra-2026-09-11-2')
  process.exit(1)
}

type StoredExtra = {
  _id: string
  date: string
  headline?: string | null
  body?: string | null
  imageCaption?: string | null
  xHashtags?: string | null
  imageUrl?: string | null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function facebookMessage(extra: StoredExtra): string {
  const message = facebookExtraMessage({
    headline: extra.headline ?? '',
    body: extra.body ?? '',
    imageCaption: extra.imageCaption,
    xHashtags: extra.xHashtags,
  })
  if (message.includes('#svpol')) return message
  return `${message}\n\n${extra.xHashtags?.trim() || '#svpol'}`
}

async function shareOne(id: string) {
  const extra = await getSanityClient().fetch<StoredExtra | null>(
    `*[_id == $id][0]{
      _id, date, headline, body, imageCaption, xHashtags,
      "imageUrl": image.asset->url
    }`,
    {id},
  )
  if (!extra?.headline?.trim() || !extra.body?.trim() || !extra.date) {
    console.error(`Hoppar över Facebook: Extra Extra ${id} saknar text`)
    return 'skipped'
  }
  return shareToFacebook({
    message: facebookMessage(extra),
    imageUrl: extra.imageUrl,
    articleUrl: absoluteUrl(extraExtraItemPath(extra.date, extra._id)),
  })
}

async function main() {
  let failed = 0
  for (const [index, id] of ids.entries()) {
    const result = await shareOne(id)
    console.log(`Facebook ${id}: ${result}`)
    if (result !== 'shared') failed += 1
    if (index < ids.length - 1) await sleep(GAP_MS)
  }
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
