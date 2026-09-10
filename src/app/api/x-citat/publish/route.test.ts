import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/extra-extra/auth', () => ({
  extraExtraSecretOk: vi.fn(() => true),
  corsHeaders: () => ({}),
}))
vi.mock('@/lib/x/share', () => ({
  shareToX: vi.fn(),
  shareToXDetailed: vi.fn(),
}))
vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}))
vi.mock('@/lib/facebook/published', () => ({
  sharePublishedExtra: vi.fn(),
}))

import {sharePublishedExtra} from '@/lib/facebook/published'
import {getWriteClient} from '@/lib/sanity/write-client'
import {shareToXDetailed} from '@/lib/x/share'
import {POST} from './route'

const validPayload = {
  preview: {
    text: 'Hönan kommenterar dagens nyhet.',
    sourceUrl: 'https://x.com/ekojonny/status/1234567890',
    sourceUsername: 'expressen',
  },
  mentions: '@expressen, svtnyheter',
  image: {mimeType: 'image/jpeg', base64: 'aaa'},
}

function request(payload: unknown) {
  return new Request('https://www.kycklingbladet.com/api/x-citat/publish', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })
}

describe('X citat publish API', () => {
  beforeEach(() => {
    vi.mocked(shareToXDetailed).mockReset()
    vi.mocked(shareToXDetailed).mockResolvedValue({result: 'shared', tweetId: 'parent-1'})
    vi.mocked(getWriteClient).mockReset()
    vi.mocked(sharePublishedExtra).mockReset()
  })

  it('posts the hen tweet then a follow-up with the source URL', async () => {
    const response = await POST(request(validPayload))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ok: true})
    expect(shareToXDetailed).toHaveBeenNthCalledWith(1, {
      text: 'Hönan kommenterar dagens nyhet.\n\n@svtnyheter',
      imageBase64: 'aaa',
    })
    expect(shareToXDetailed).toHaveBeenNthCalledWith(2, {
      text: 'Inspirerat av: https://x.com/ekojonny/status/1234567890',
      inReplyToTweetId: 'parent-1',
    })
    expect(getWriteClient).not.toHaveBeenCalled()
    expect(sharePublishedExtra).not.toHaveBeenCalled()
  })

  it('posts only the hen tweet when there is no source URL', async () => {
    const payload = {
      ...validPayload,
      mentions: '',
      preview: {text: 'Hönan kommenterar dagens nyhet.'},
    }

    const response = await POST(request(payload))

    expect(response.status).toBe(200)
    expect(shareToXDetailed).toHaveBeenCalledOnce()
    expect(shareToXDetailed).toHaveBeenCalledWith({
      text: 'Hönan kommenterar dagens nyhet.',
      imageBase64: 'aaa',
    })
  })

  it('rejects an invalid source URL before posting', async () => {
    const payload = {
      ...validPayload,
      preview: {...validPayload.preview, sourceUrl: 'https://x.com/ekojonny'},
    }

    const response = await POST(request(payload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'Ogiltig tweet-URL'})
    expect(shareToXDetailed).not.toHaveBeenCalled()
  })

  it('rejects a missing image', async () => {
    const response = await POST(request({...validPayload, image: null}))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'Saknar bild'})
    expect(shareToXDetailed).not.toHaveBeenCalled()
  })

  it('reports an X posting failure', async () => {
    vi.mocked(shareToXDetailed).mockResolvedValue({
      result: 'failed',
      error: 'X HTTP 403',
    })

    const response = await POST(request(validPayload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Kunde inte posta till X: X HTTP 403',
    })
  })

  it('keeps the hen tweet if the follow-up fails', async () => {
    vi.mocked(shareToXDetailed)
      .mockResolvedValueOnce({result: 'shared', tweetId: 'parent-1'})
      .mockResolvedValueOnce({result: 'failed', error: 'reply blocked'})

    const response = await POST(request(validPayload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Hönstweeten gick ut men uppföljningen misslyckades: reply blocked',
    })
  })

  it('reports missing X credentials', async () => {
    vi.mocked(shareToXDetailed).mockResolvedValue({result: 'skipped'})

    const response = await POST(request(validPayload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'X-nycklar saknas'})
  })
})
