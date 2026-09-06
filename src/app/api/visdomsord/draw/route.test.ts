import {afterEach, describe, expect, it, vi} from 'vitest'
import {generateImageBriefFromCopy} from '@/lib/generate/image-brief'
import {attachLeadImage} from '@/lib/lead/attach-image'
import {getWriteClient} from '@/lib/sanity/write-client'
import {maxDuration, OPTIONS, POST} from './route'

vi.mock('@/lib/generate/image-brief', () => ({
  generateImageBriefFromCopy: vi.fn(),
}))

vi.mock('@/lib/lead/attach-image', () => ({
  attachLeadImage: vi.fn(),
}))

vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}))

function authorized(body: unknown) {
  return new Request('https://kycklingbladet.se/api/visdomsord/draw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-extra-extra-secret': 'studio-secret',
    },
    body: JSON.stringify(body),
  })
}

describe('visdomsord draw route', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(generateImageBriefFromCopy).mockReset()
    vi.mocked(attachLeadImage).mockReset()
    vi.mocked(getWriteClient).mockReset()
  })

  it('exports HTTP handlers and a 60s duration budget', () => {
    expect(typeof OPTIONS).toBe('function')
    expect(typeof POST).toBe('function')
    expect(maxDuration).toBe(60)
  })

  it('draws a duplicate id only once', async () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    const fetch = vi.fn().mockResolvedValue([
      {_id: 'wisdom-1', quote: 'Sitt inte', henName: 'Gerda'},
    ])
    vi.mocked(getWriteClient).mockReturnValue({fetch} as never)
    vi.mocked(generateImageBriefFromCopy).mockResolvedValue({
      shotType: 'intervju',
      caption: 'Gerda delar ett visdomsord.',
      scenePrompt: 'A wise hen in a coop.',
    })
    vi.mocked(attachLeadImage).mockResolvedValue({image: null, imageError: null})

    const response = await POST(authorized({ids: ['wisdom-1', 'wisdom-1']}))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      results: [{id: 'wisdom-1', imageError: null}],
    })
    expect(fetch).toHaveBeenCalledWith(expect.any(String), {ids: ['wisdom-1']})
    expect(generateImageBriefFromCopy).toHaveBeenCalledTimes(1)
    expect(attachLeadImage).toHaveBeenCalledTimes(1)
  })
})
