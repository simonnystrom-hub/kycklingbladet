import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/extra-extra/auth', () => ({
  extraExtraSecretOk: vi.fn(() => true),
  corsHeaders: () => ({}),
}))
vi.mock('@/lib/x/share', () => ({
  shareToX: vi.fn(),
}))
vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}))
vi.mock('@/lib/facebook/published', () => ({
  sharePublishedExtra: vi.fn(),
}))

import {sharePublishedExtra} from '@/lib/facebook/published'
import {getWriteClient} from '@/lib/sanity/write-client'
import {shareToX} from '@/lib/x/share'
import {POST} from './route'

const validPayload = {
  preview: {
    text: 'Hönan kommenterar dagens nyhet.',
    quoteTweetId: '1234567890',
    sourceUsername: 'expressen',
  },
  mentions: 'svtnyheter',
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
    vi.mocked(shareToX).mockReset()
    vi.mocked(shareToX).mockResolvedValue('shared')
    vi.mocked(getWriteClient).mockReset()
    vi.mocked(sharePublishedExtra).mockReset()
  })

  it('publishes a quote tweet with image and normalized mentions', async () => {
    const response = await POST(request(validPayload))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ok: true})
    expect(shareToX).toHaveBeenCalledWith({
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
    expect(shareToX).not.toHaveBeenCalled()
  })

  it('rejects a missing image', async () => {
    const response = await POST(request({...validPayload, image: null}))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'Saknar bild'})
    expect(shareToX).not.toHaveBeenCalled()
  })

  it('reports an X posting failure', async () => {
    vi.mocked(shareToX).mockResolvedValue('failed')

    const response = await POST(request(validPayload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'Kunde inte posta till X'})
  })

  it('reports missing X credentials', async () => {
    vi.mocked(shareToX).mockResolvedValue('skipped')

    const response = await POST(request(validPayload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'X-nycklar saknas'})
  })
})
