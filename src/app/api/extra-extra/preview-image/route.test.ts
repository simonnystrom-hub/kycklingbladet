import {afterEach, describe, expect, it, vi} from 'vitest'
import {drawExtraImage} from '@/lib/extra-extra/draw'
import {parseExtraImageShotType} from '@/lib/generate/extra-image'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import {OPTIONS, POST} from './route'

vi.mock('@/lib/extra-extra/draw', () => ({
  drawExtraImage: vi.fn(),
}))

const flashPreview = {
  kicker: EXTRA_KICKER,
  headline: 'Tuppchock på riksväg 40',
  body: 'Hela gården håller andan.',
  sourceUrl: 'https://www.expressen.se/nyheter/test',
  sourceHeadline: 'Trafikstopp på riksväg 40',
  sourceNewspaper: 'Expressen',
  sourceNewspaperSlug: 'expressen',
  promptVersion: 'kb-extra-v1',
  modelVersion: 'claude-test',
}

const imagePreview = {
  ...flashPreview,
  imageShotType: 'incident',
  imageCaption: 'Tuppen Gösta vid luckan.',
  imagePrompt: 'A rooster by a hatch.',
}

function authorized(body: unknown) {
  return new Request('https://kycklingbladet.se/api/extra-extra/preview-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-extra-extra-secret': 'studio-secret',
    },
    body: JSON.stringify(body),
  })
}

describe('preview-image route', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(drawExtraImage).mockReset()
  })

  it('exports HTTP handlers', () => {
    expect(typeof OPTIONS).toBe('function')
    expect(typeof POST).toBe('function')
  })

  it('answers OPTIONS with the same CORS as preview', () => {
    const response = OPTIONS()
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'Content-Type, x-extra-extra-secret',
    )
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
  })

  it('rejects unauthorized POST', async () => {
    const response = await POST(
      new Request('https://kycklingbladet.se/api/extra-extra/preview-image', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: '{}',
      }),
    )
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({error: 'Ej behörig'})
  })

  it('returns 400 for an invalid preview', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    const response = await POST(authorized({preview: {headline: 'nope'}}))
    expect(response.status).toBe(400)
  })

  it('returns 200 with Saknar bildunderlag when the preview has no brief', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    const response = await POST(authorized({preview: flashPreview}))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      preview: flashPreview,
      image: null,
      imageError: 'Saknar bildunderlag',
    })
    expect(drawExtraImage).not.toHaveBeenCalled()
  })

  it('returns 200 with Saknar bildunderlag when image fields are empty strings', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    const response = await POST(
      authorized({
        preview: {
          ...flashPreview,
          imageShotType: '',
          imageCaption: '',
          imagePrompt: '',
        },
      }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      preview: flashPreview,
      image: null,
      imageError: 'Saknar bildunderlag',
    })
  })

  it('stays 200 when Gemini fails after a valid brief', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    vi.mocked(drawExtraImage).mockResolvedValue({
      image: null,
      imageError: 'Kunde inte rita bilden',
    })
    const response = await POST(authorized({preview: imagePreview}))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      preview: imagePreview,
      image: null,
      imageError: 'Kunde inte rita bilden',
    })
  })

  it('overrides shot type before draw and echoes it on preview', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    vi.mocked(drawExtraImage).mockResolvedValue({
      image: {mimeType: 'image/jpeg', base64: 'abc'},
      imageError: null,
    })
    const response = await POST(authorized({preview: imagePreview, shotType: 'intervju'}))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      preview: {...imagePreview, imageShotType: 'intervju'},
      image: {mimeType: 'image/jpeg', base64: 'abc'},
      imageError: null,
    })
    expect(drawExtraImage).toHaveBeenCalledWith({
      shotType: 'intervju',
      caption: 'Tuppen Gösta vid luckan.',
      scenePrompt: 'A rooster by a hatch.',
    })
  })

  it('accepts valid shot type overrides', () => {
    expect(parseExtraImageShotType('intervju')).toBe('intervju')
    expect(parseExtraImageShotType('invalid')).toBeNull()
  })
})
