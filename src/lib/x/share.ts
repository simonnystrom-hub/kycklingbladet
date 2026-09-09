import {TwitterApi} from 'twitter-api-v2'
import {envSecret} from '@/lib/env-secret'

export type ShareToXResult = 'shared' | 'skipped' | 'failed'

export type ShareToXDetail = {
  result: ShareToXResult
  error?: string
}

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

export function xErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const data = 'data' in error ? (error as {data?: unknown}).data : undefined
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      if (typeof record.detail === 'string' && record.detail.trim()) return record.detail.trim()
      if (typeof record.title === 'string' && record.title.trim()) return record.title.trim()
      const first = Array.isArray(record.errors) ? record.errors[0] : undefined
      if (first && typeof first === 'object') {
        const message = (first as {message?: unknown}).message
        if (typeof message === 'string' && message.trim()) return message.trim()
      }
    }
    if ('isAuthError' in error && (error as {isAuthError?: boolean}).isAuthError) {
      return 'X-autentisering misslyckades'
    }
    if ('code' in error && (error as {code?: unknown}).code === 429) {
      return 'X har tillfälligt stoppat fler anrop'
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return 'okänt fel'
}

function mediaCategory(mimeType: string): 'tweet_gif' | 'tweet_image' {
  return mimeType.includes('gif') ? 'tweet_gif' : 'tweet_image'
}

async function uploadXBuffer(
  client: TwitterApi,
  buf: Buffer,
  mimeType: string,
): Promise<string> {
  return client.v2.uploadMedia(buf, {
    media_type: mimeType as 'image/jpeg',
    media_category: mediaCategory(mimeType),
  })
}

async function uploadXImage(client: TwitterApi, imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl, {signal: AbortSignal.timeout(30_000)})
  if (!response.ok) {
    throw new Error(`bildhämtning ${response.status}`)
  }
  const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg'
  const buf = Buffer.from(await response.arrayBuffer())
  return uploadXBuffer(client, buf, mimeType)
}

export async function shareToX(input: ShareToXInput): Promise<ShareToXResult> {
  return (await shareToXDetailed(input)).result
}

export async function shareToXDetailed(input: ShareToXInput): Promise<ShareToXDetail> {
  const config = xConfig()
  if (!config) {
    console.error(
      'Hoppar över X: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN eller X_ACCESS_TOKEN_SECRET saknas',
    )
    return {result: 'skipped'}
  }

  const text = input.text.trim()
  if (!text) {
    console.error('Hoppar över X: inlägget saknar text')
    return {result: 'skipped'}
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
        mediaId = await uploadXBuffer(client, Buffer.from(imageBase64, 'base64'), 'image/jpeg')
      } catch (error) {
        const message = xErrorMessage(error)
        console.error('Kunde inte ladda upp bild till X', message)
        return {result: 'failed', error: message}
      }
    } else {
      const imageUrl = input.imageUrl?.trim()
      if (imageUrl) {
        try {
          mediaId = await uploadXImage(client, imageUrl)
        } catch (error) {
          console.error('Kunde inte ladda upp bild till X, postar utan bild', xErrorMessage(error))
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
      return {result: 'failed', error: 'X svarade utan tweet-id'}
    }
    console.log(`Utlagt på X: ${tweet.data.id}`)
    return {result: 'shared'}
  } catch (error) {
    const message = xErrorMessage(error)
    console.error('Kunde inte posta till X', message)
    return {result: 'failed', error: message}
  }
}
