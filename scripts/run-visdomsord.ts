import {stockholmToday} from '../src/lib/select/stockholm-date'
import {
  alreadyPostedOn,
  pickNextUnusedWithImage,
  type VisdomsordRow,
} from '../src/lib/visdomsord/queue'
import {facebookWisdomMessage} from '../src/lib/visdomsord/message'
import {shareToFacebook} from '../src/lib/facebook/share'
import {getWriteClient} from '../src/lib/sanity/write-client'

export async function runVisdomsord(now = new Date()): Promise<'posted' | 'skipped'> {
  const date = stockholmToday(now)
  const client = getWriteClient()
  const rows = await client.fetch<VisdomsordRow[]>(
    `*[_type == "visdomsord" && !(_id in path("drafts.**"))] | order(_createdAt asc){
      _id, quote, henName, usedDate, _createdAt, "imageUrl": image.asset->url
    }`,
  )
  if (alreadyPostedOn(rows, date)) {
    console.log(`Hoppar över visdomsord ${date}: redan utlagt`)
    return 'skipped'
  }
  const next = pickNextUnusedWithImage(rows)
  if (!next) {
    console.log(`Tom visdomsord-kö ${date}`)
    return 'skipped'
  }
  const result = await shareToFacebook({
    message: facebookWisdomMessage({quote: next.quote, henName: next.henName}),
    imageUrl: next.imageUrl,
  })
  if (result === 'shared') {
    await client.patch(next._id).set({usedDate: date}).commit()
    console.log(`Utlagt visdomsord ${next._id}`)
    return 'posted'
  }
  if (result === 'failed') {
    console.error(`Facebook misslyckades för visdomsord ${next._id}`)
    process.exitCode = 1
    return 'skipped'
  }
  console.error(`Hoppar över visdomsord ${next._id}: ingen Facebook-post`)
  return 'skipped'
}

runVisdomsord().catch((error) => {
  console.error(error)
  process.exit(1)
})
