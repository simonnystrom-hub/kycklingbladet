import {stockholmToday} from '../src/lib/select/stockholm-date'
import {
  alreadyPostedOn,
  pickNextUnused,
  type VisdomsordRow,
} from '../src/lib/visdomsord/queue'
import {facebookWisdomMessage} from '../src/lib/visdomsord/message'
import {visdomsordShareOutcome} from '../src/lib/visdomsord/share-outcome'
import {shareFacebookFeed} from '../src/lib/facebook/share'
import {shareToX} from '../src/lib/x/share'
import {getWriteClient} from '../src/lib/sanity/write-client'

export async function runVisdomsord(now = new Date()): Promise<'posted' | 'skipped'> {
  const date = stockholmToday(now)
  const client = getWriteClient()
  const rows = await client.fetch<VisdomsordRow[]>(
    `*[_type == "visdomsord" && !(_id in path("drafts.**"))] | order(_createdAt asc){
      _id, quote, henName, usedDate, queueOrder, _createdAt
    }`,
  )
  if (alreadyPostedOn(rows, date)) {
    console.log(`Hoppar över visdomsord ${date}: redan utlagt`)
    return 'skipped'
  }
  const next = pickNextUnused(rows)
  if (!next) {
    console.log(`Tom visdomsord-kö ${date}`)
    return 'skipped'
  }
  const message = facebookWisdomMessage({quote: next.quote, henName: next.henName})
  const [facebook, x] = await Promise.all([
    shareFacebookFeed(message),
    shareToX({text: message}),
  ])
  const outcome = visdomsordShareOutcome(facebook, x)
  if (facebook === 'failed') {
    console.error(`Facebook misslyckades för visdomsord ${next._id}`)
  }
  if (x === 'failed') {
    console.error(`X misslyckades för visdomsord ${next._id}`)
  }
  if (outcome.failed) {
    process.exitCode = 1
  }
  if (outcome.markUsed) {
    await client.patch(next._id).set({usedDate: date}).commit()
    console.log(`Utlagt visdomsord ${next._id}`)
    return 'posted'
  }
  console.error(`Hoppar över visdomsord ${next._id}: ingen post`)
  return 'skipped'
}

runVisdomsord().catch((error) => {
  console.error(error)
  process.exit(1)
})
