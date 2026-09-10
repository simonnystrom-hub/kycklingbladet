import {shareToXDetailed} from '@/lib/x/share'
import {
  loadXReply,
  patchXReplyError,
  patchXReplyPosted,
} from './persist'

const FAILED_PREFIX = 'Kunde inte posta till X'

async function failPublish(id: string, error?: string): Promise<never> {
  const storedError = error || FAILED_PREFIX
  await patchXReplyError(id, storedError)
  throw new Error(error ? `${FAILED_PREFIX}: ${error}` : FAILED_PREFIX)
}

export async function publishXReply(
  id: string,
): Promise<{postedTweetId: string}> {
  const reply = await loadXReply(id)
  if (!reply) throw new Error('Hittade inte svaret')
  if (reply.status !== 'pending') throw new Error('Svaret är inte i kön')
  if (!reply.replyText.trim()) throw new Error('Saknar svars-text')

  const posted = await shareToXDetailed({
    text: reply.replyText,
    inReplyToTweetId: reply.sourceTweetId,
  })

  if (posted.result === 'skipped') {
    throw new Error('X-nycklar saknas')
  }
  if (posted.result === 'failed') {
    return failPublish(id, posted.error)
  }
  if (!posted.tweetId) {
    return failPublish(id, 'X svarade utan tweet-id')
  }

  await patchXReplyPosted(id, posted.tweetId)
  return {postedTweetId: posted.tweetId}
}
