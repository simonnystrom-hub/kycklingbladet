import {TwitterApi} from 'twitter-api-v2'
import {logXConfigShape, xConfig} from '@/lib/x/share'
import type {XMention} from './filter'

export async function fetchXMentions(
  sinceId?: string | null,
): Promise<{ourUserId: string; mentions: XMention[]}> {
  const config = xConfig()
  if (!config) throw new Error('X-nycklar saknas')

  try {
    logXConfigShape(config)
    const client = new TwitterApi(config)
    const me = await client.v2.me()
    const ourUserId = me.data.id
    const paginator = await client.v2.userMentionTimeline(ourUserId, {
      since_id: sinceId || undefined,
      max_results: 100,
      expansions: ['author_id', 'referenced_tweets.id'],
      'tweet.fields': ['text', 'author_id', 'referenced_tweets'],
      'user.fields': ['username'],
    })

    let fetchedPages = 1
    while (!paginator.done && fetchedPages < 5) {
      await paginator.fetchNext()
      fetchedPages += 1
    }

    const mentions: XMention[] = []
    for (const tweet of paginator.tweets) {
      const authorId = tweet.author_id
      const username = paginator.includes.users.find((user) => user.id === authorId)?.username
      if (!tweet.id || !tweet.text || !authorId || !username) continue

      mentions.push({
        id: tweet.id,
        text: tweet.text,
        authorId,
        authorUsername: username,
        inReplyToStatusId:
          tweet.referenced_tweets?.find((reference) => reference.type === 'replied_to')?.id ?? null,
      })
    }

    return {ourUserId, mentions}
  } catch {
    console.error('Kunde inte hämta mentions från X')
    throw new Error('Kunde inte hämta mentions')
  }
}
