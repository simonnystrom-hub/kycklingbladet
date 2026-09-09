import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/extra-extra/auth', () => ({
  extraExtraSecretOk: vi.fn(() => true),
  corsHeaders: () => ({'Access-Control-Allow-Origin': '*'}),
}))
vi.mock('@/lib/extra-extra/draw', () => ({
  drawExtraImage: vi.fn(),
}))

import {extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {drawExtraImage} from '@/lib/extra-extra/draw'
import {maxDuration, OPTIONS, POST} from './route'

const imagePreview = {
  text: 'Kackel',
  imageShotType: 'incident',
  imageCaption: 'Hönan.',
  imagePrompt: 'A hen.',
}

function request(payload: unknown) {
  return new Request('https://www.kycklingbladet.com/api/x-citat/preview-image', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })
}

describe('X citat preview-image API', () => {
  beforeEach(() => {
    vi.mocked(extraExtraSecretOk).mockReset()
    vi.mocked(extraExtraSecretOk).mockReturnValue(true)
    vi.mocked(drawExtraImage).mockReset()
  })

  it('draws and returns an image for a valid preview brief', async () => {
    vi.mocked(drawExtraImage).mockResolvedValue({
      image: {mimeType: 'image/jpeg', base64: 'abc'},
      imageError: null,
    })

    const response = await POST(request({preview: imagePreview}))

    expect(response.status).toBe(200)
    expect(drawExtraImage).toHaveBeenCalledWith({
      shotType: 'incident',
      caption: 'Hönan.',
      scenePrompt: 'A hen.',
    })
    expect(await response.json()).toEqual({
      preview: imagePreview,
      image: {mimeType: 'image/jpeg', base64: 'abc'},
      imageError: null,
    })
  })

  it('returns a missing-brief result without drawing', async () => {
    const preview = {text: 'Kackel'}

    const response = await POST(request({preview}))

    expect(response.status).toBe(200)
    expect(drawExtraImage).not.toHaveBeenCalled()
    expect(await response.json()).toEqual({
      preview,
      image: null,
      imageError: 'Saknar bildunderlag',
    })
  })

  it('rejects unauthorized requests', async () => {
    vi.mocked(extraExtraSecretOk).mockReturnValue(false)

    const response = await POST(request({preview: imagePreview}))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({error: 'Ej behörig'})
    expect(drawExtraImage).not.toHaveBeenCalled()
  })

  it('rejects an invalid preview payload', async () => {
    const response = await POST(request({preview: null}))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'Ogiltig förfrågan'})
    expect(drawExtraImage).not.toHaveBeenCalled()
  })

  it('exports duration and CORS preflight handlers', () => {
    expect(maxDuration).toBe(60)
    const response = OPTIONS()
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
