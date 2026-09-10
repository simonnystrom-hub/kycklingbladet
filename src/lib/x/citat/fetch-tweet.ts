import {TwitterApi} from 'twitter-api-v2'
import {logXConfigShape, xConfig} from '@/lib/x/share'

export type SourceTweet = {id: string; username: string; text: string}

export function reusedSourceTweet(
  payload: Record<string, unknown>,
  statusId: string | null,
): SourceTweet | null {
  if (!statusId) return null
  const id = typeof payload.quoteTweetId === 'string' ? payload.quoteTweetId.trim() : ''
  const text = typeof payload.text === 'string' ? payload.text.trim() : ''
  const username = typeof payload.sourceUsername === 'string' ? payload.sourceUsername.trim() : ''
  if (!id || id !== statusId || !text || !username) return null
  return {id, username, text}
}

export async function fetchSourceTweet(statusId: string): Promise<SourceTweet> {
  const config = xConfig()
  if (!config) throw new Error('X-nycklar saknas')

  try {
    logXConfigShape(config)
    const client = new TwitterApi(config)
    const tweet = await client.v2.singleTweet(statusId, {
      expansions: ['author_id'],
      'tweet.fields': ['text', 'author_id'],
      'user.fields': ['username'],
    })

    const {id, text, author_id: authorId} = tweet.data
    const username = tweet.includes?.users?.find((user) => user.id === authorId)?.username
    if (!id || !text?.trim() || !username?.trim()) {
      throw new Error('Kunde inte hämta tweeten')
    }

    return {id, username, text}
  } catch (error) {
    console.error('Kunde inte hämta tweeten från X', error)
    throw new Error('Kunde inte hämta tweeten')
  }
}
