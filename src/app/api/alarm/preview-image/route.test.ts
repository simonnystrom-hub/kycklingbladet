import {afterEach, describe, expect, it, vi} from 'vitest'
import {attachLeadImage} from '@/lib/lead/attach-image'
import {getWriteClient} from '@/lib/sanity/write-client'
import {maxDuration, OPTIONS, POST} from './route'

vi.mock('@/lib/lead/attach-image', () => ({
  attachLeadImage: vi.fn(),
}))

vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}))

const alarmDoc = {
  _id: 'alarm-1',
  date: '2026-09-05',
  imageCaption: 'Tuppen Gösta vid luckan.',
  imagePrompt: 'A rooster by a hatch.',
  imageShotType: 'incident',
}

function authorized(body: unknown) {
  return new Request('https://kycklingbladet.se/api/alarm/preview-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-extra-extra-secret': 'studio-secret',
    },
    body: JSON.stringify(body),
  })
}

function mockFetch(doc: unknown) {
  const fetch = vi.fn().mockResolvedValue(doc)
  vi.mocked(getWriteClient).mockReturnValue({fetch} as never)
  return fetch
}

describe('alarm preview-image route', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(attachLeadImage).mockReset()
    vi.mocked(getWriteClient).mockReset()
  })

  it('exports HTTP handlers', () => {
    expect(typeof OPTIONS).toBe('function')
    expect(typeof POST).toBe('function')
    expect(maxDuration).toBe(60)
  })

  it('answers OPTIONS with the same CORS as extra-extra', () => {
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
      new Request('https://kycklingbladet.se/api/alarm/preview-image', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: 'alarm-1'}),
      }),
    )
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({error: 'Ej behörig'})
  })

  it('returns 400 when id is missing', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    const response = await POST(authorized({}))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({error: 'Ogiltig förfrågan'})
    expect(attachLeadImage).not.toHaveBeenCalled()
  })

  it('returns 400 when no matching alarm exists', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    mockFetch(null)
    const response = await POST(authorized({id: 'missing-alarm'}))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({error: 'Ogiltig förfrågan'})
    expect(attachLeadImage).not.toHaveBeenCalled()
  })

  it('returns Saknar bildunderlag without drawing when the alarm has no brief', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    mockFetch({_id: 'alarm-1', date: '2026-09-05'})
    const response = await POST(authorized({id: 'alarm-1'}))
    expect(response.status).toBe(200)
    expect(attachLeadImage).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      image: null,
      imageError: 'Saknar bildunderlag',
    })
  })

  it('keeps HTTP 200 when Gemini fails', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    mockFetch(alarmDoc)
    vi.mocked(attachLeadImage).mockResolvedValue({
      image: null,
      imageError: 'Kunde inte rita bilden',
    })
    const response = await POST(authorized({id: 'alarm-1'}))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      image: null,
      imageError: 'Kunde inte rita bilden',
      imageCaption: 'Tuppen Gösta vid luckan.',
      imageShotType: 'incident',
    })
    expect(attachLeadImage).toHaveBeenCalledTimes(1)
  })

  it('attaches once and returns the JPEG on success', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    mockFetch(alarmDoc)
    vi.mocked(attachLeadImage).mockResolvedValue({
      image: {mimeType: 'image/jpeg', base64: 'abc'},
      imageError: null,
    })
    const response = await POST(authorized({id: 'alarm-1', shotType: 'intervju'}))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      image: {mimeType: 'image/jpeg', base64: 'abc'},
      imageError: null,
      imageCaption: 'Tuppen Gösta vid luckan.',
      imageShotType: 'intervju',
    })
    expect(attachLeadImage).toHaveBeenCalledTimes(1)
    expect(attachLeadImage).toHaveBeenCalledWith({
      id: 'alarm-1',
      date: '2026-09-05',
      brief: {
        shotType: 'intervju',
        caption: 'Tuppen Gösta vid luckan.',
        scenePrompt: 'A rooster by a hatch.',
      },
    })
  })
})
