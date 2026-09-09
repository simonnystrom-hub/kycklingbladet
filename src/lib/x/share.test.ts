import {afterEach, describe, expect, it, vi} from 'vitest'

const {tweet, uploadMedia} = vi.hoisted(() => ({
  tweet: vi.fn(),
  uploadMedia: vi.fn(),
}))

vi.mock('twitter-api-v2', () => ({
  TwitterApi: vi.fn().mockImplementation(() => ({
    v1: {uploadMedia},
    v2: {tweet},
  })),
}))

import {shareToX} from './share'

function stubXEnv() {
  vi.stubEnv('X_API_KEY', '"app-key"')
  vi.stubEnv('X_API_SECRET', "'app-secret'")
  vi.stubEnv('X_ACCESS_TOKEN', 'access-token')
  vi.stubEnv('X_ACCESS_TOKEN_SECRET', 'access-secret')
}

describe('shareToX', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    tweet.mockReset()
    uploadMedia.mockReset()
  })

  it('accepts X_ACCESS_SECRET as the token secret', async () => {
    vi.stubEnv('X_API_KEY', 'app-key')
    vi.stubEnv('X_API_SECRET', 'app-secret')
    vi.stubEnv('X_ACCESS_TOKEN', 'access-token')
    vi.stubEnv('X_ACCESS_TOKEN_SECRET', '')
    vi.stubEnv('X_ACCESS_SECRET', 'access-secret')
    tweet.mockResolvedValue({data: {id: 'tweet-4'}})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    await expect(shareToX({text: 'Hej gården'})).resolves.toBe('shared')
    expect(tweet).toHaveBeenCalledWith({text: 'Hej gården'})
  })

  it('does not call X when env is missing', async () => {
    vi.stubEnv('X_API_KEY', '')
    vi.stubEnv('X_API_SECRET', '')
    vi.stubEnv('X_ACCESS_TOKEN', '')
    vi.stubEnv('X_ACCESS_TOKEN_SECRET', '')
    vi.stubEnv('X_ACCESS_SECRET', '')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(shareToX({text: 'Hej gården'})).resolves.toBe('skipped')
    expect(tweet).not.toHaveBeenCalled()
  })

  it('posts text without media when there is no image', async () => {
    stubXEnv()
    tweet.mockResolvedValue({data: {id: 'tweet-1'}})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    await expect(shareToX({text: 'KUCKELIKUUUU!'})).resolves.toBe('shared')
    expect(uploadMedia).not.toHaveBeenCalled()
    expect(tweet).toHaveBeenCalledWith({text: 'KUCKELIKUUUU!'})
  })

  it('uploads the image and attaches it to the tweet', async () => {
    stubXEnv()
    uploadMedia.mockResolvedValue('media-9')
    tweet.mockResolvedValue({data: {id: 'tweet-2'}})
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: {'Content-Type': 'image/jpeg'},
        }),
      ),
    )
    vi.spyOn(console, 'log').mockImplementation(() => {})

    await expect(
      shareToX({
        text: 'Larmrubrik',
        imageUrl: 'https://cdn.sanity.io/lead.jpg',
      }),
    ).resolves.toBe('shared')

    expect(uploadMedia).toHaveBeenCalledOnce()
    expect(tweet).toHaveBeenCalledWith({
      text: 'Larmrubrik',
      media: {media_ids: ['media-9']},
    })
  })

  it('still tweets when image upload fails', async () => {
    stubXEnv()
    tweet.mockResolvedValue({data: {id: 'tweet-3'}})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, {status: 500})))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    await expect(
      shareToX({text: 'Larmrubrik', imageUrl: 'https://cdn.sanity.io/lead.jpg'}),
    ).resolves.toBe('shared')
    expect(tweet).toHaveBeenCalledWith({text: 'Larmrubrik'})
  })

  it('returns failed when X rejects the tweet', async () => {
    stubXEnv()
    tweet.mockRejectedValue(new Error('403'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    await expect(shareToX({text: 'Larmrubrik'})).resolves.toBe('failed')
  })

  it('uploads jpeg base64 and sets quote_tweet_id', async () => {
    stubXEnv()
    uploadMedia.mockResolvedValue('media-q')
    tweet.mockResolvedValue({data: {id: 'tweet-q'}})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    await expect(
      shareToX({
        text: 'Kackel',
        imageBase64: Buffer.from([1, 2, 3]).toString('base64'),
        quoteTweetId: '2097812376640696829',
      }),
    ).resolves.toBe('shared')

    expect(uploadMedia).toHaveBeenCalledOnce()
    expect(tweet).toHaveBeenCalledWith({
      text: 'Kackel',
      quote_tweet_id: '2097812376640696829',
      media: {media_ids: ['media-q']},
    })
  })

  it('fails without tweeting when jpeg base64 upload fails', async () => {
    stubXEnv()
    uploadMedia.mockRejectedValue(new Error('upload failed'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    await expect(
      shareToX({
        text: 'Kackel',
        imageBase64: Buffer.from([1, 2, 3]).toString('base64'),
        quoteTweetId: '2097812376640696829',
      }),
    ).resolves.toBe('failed')

    expect(tweet).not.toHaveBeenCalled()
  })
})
