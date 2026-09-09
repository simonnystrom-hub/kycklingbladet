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
    quoteTweetId: '1234567890',
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
    vi.mocked(shareToXDetailed).mockResolvedValue({result: 'shared'})
    vi.mocked(getWriteClient).mockReset()
    vi.mocked(sharePublishedExtra).mockReset()
  })

  it('publishes a quote tweet with image and normalized mentions', async () => {
    const response = await POST(request(validPayload))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ok: true})
    const shareInput = vi.mocked(shareToXDetailed).mock.calls[0]?.[0]
    expect(shareInput?.text).toContain('@svtnyheter')
    expect(shareInput?.text).not.toContain('@expressen')
    expect(shareToXDetailed).toHaveBeenCalledWith({
      text: 'Hönan kommenterar dagens nyhet.\n\n@svtnyheter',
      imageBase64: 'aaa',
      quoteTweetId: '1234567890',
    })
    expect(getWriteClient).not.toHaveBeenCalled()
    expect(sharePublishedExtra).not.toHaveBeenCalled()
  })

  it('rejects a missing quote tweet id', async () => {
    const payload = {
      ...validPayload,
      preview: {...validPayload.preview, quoteTweetId: ' '},
    }

    const response = await POST(request(payload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'Saknar tweet att citera'})
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
      error: 'You are not allowed to quote this Tweet.',
    })

    const response = await POST(request(validPayload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Kunde inte posta till X: You are not allowed to quote this Tweet.',
    })
  })

  it('reports missing X credentials', async () => {
    vi.mocked(shareToXDetailed).mockResolvedValue({result: 'skipped'})

    const response = await POST(request(validPayload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'X-nycklar saknas'})
  })
})
