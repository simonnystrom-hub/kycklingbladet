import {TwitterApi} from 'twitter-api-v2'
import {envSecret} from '@/lib/env-secret'

export type ShareToXResult = 'shared' | 'skipped' | 'failed'

export type ShareToXInput = {
  text: string
  imageUrl?: string | null
  imageBase64?: string | null
  quoteTweetId?: string | null
}

export type XConfig = {
  appKey: string
  appSecret: string
  accessToken: string
  accessSecret: string
}

export function xConfig(): XConfig | null {
  const appKey = envSecret(process.env.X_API_KEY)
  const appSecret = envSecret(process.env.X_API_SECRET)
  const accessToken = envSecret(process.env.X_ACCESS_TOKEN)
  const accessSecret =
    envSecret(process.env.X_ACCESS_TOKEN_SECRET) || envSecret(process.env.X_ACCESS_SECRET)
  if (!appKey || !appSecret || !accessToken || !accessSecret) return null
  return {appKey, appSecret, accessToken, accessSecret}
}

/** Logs length/shape only — never the token itself. */
export function logXConfigShape(config: XConfig): void {
  console.log(
    `X-konfig: apiKey längd=${config.appKey.length} accessToken längd=${config.accessToken.length}`,
  )
}

async function uploadXImage(client: TwitterApi, imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl, {signal: AbortSignal.timeout(30_000)})
  if (!response.ok) {
    throw new Error(`bildhämtning ${response.status}`)
  }
  const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg'
  const buf = Buffer.from(await response.arrayBuffer())
  return client.v1.uploadMedia(buf, {mimeType})
}

export async function shareToX(input: ShareToXInput): Promise<ShareToXResult> {
  const config = xConfig()
  if (!config) {
    console.error(
      'Hoppar över X: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN eller X_ACCESS_TOKEN_SECRET saknas',
    )
    return 'skipped'
  }

  const text = input.text.trim()
  if (!text) {
    console.error('Hoppar över X: inlägget saknar text')
    return 'skipped'
  }

  try {
    logXConfigShape(config)
    const client = new TwitterApi({
      appKey: config.appKey,
      appSecret: config.appSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessSecret,
    })

    let mediaId: string | undefined
    const imageBase64 = input.imageBase64?.trim()
    if (imageBase64) {
      try {
        mediaId = await client.v1.uploadMedia(Buffer.from(imageBase64, 'base64'), {
          mimeType: 'image/jpeg',
        })
      } catch (error) {
        console.error('Kunde inte ladda upp bild till X, postar utan bild', error)
      }
    } else {
      const imageUrl = input.imageUrl?.trim()
      if (imageUrl) {
        try {
          mediaId = await uploadXImage(client, imageUrl)
        } catch (error) {
          console.error('Kunde inte ladda upp bild till X, postar utan bild', error)
        }
      }
    }

    const quoteTweetId = input.quoteTweetId?.trim()
    const payload: {
      text: string
      quote_tweet_id?: string
      media?: {media_ids: [string]}
    } = {text}
    if (quoteTweetId) payload.quote_tweet_id = quoteTweetId
    if (mediaId) payload.media = {media_ids: [mediaId] as [string]}
    const tweet = await client.v2.tweet(payload)
    if (!tweet.data?.id) {
      console.error('X svarade utan tweet-id')
      return 'failed'
    }
    console.log(`Utlagt på X: ${tweet.data.id}`)
    return 'shared'
  } catch (error) {
    console.error('Kunde inte posta till X', error)
    return 'failed'
  }
}
