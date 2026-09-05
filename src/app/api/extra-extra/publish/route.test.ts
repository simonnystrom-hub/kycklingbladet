import {beforeEach, describe, expect, it, vi} from 'vitest'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'

vi.mock('@/lib/extra-extra/auth', () => ({
  extraExtraSecretOk: vi.fn(() => true),
  corsHeaders: () => ({}),
}))
vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}))
vi.mock('@/lib/facebook/published', () => ({
  sharePublishedExtra: vi.fn(),
}))
vi.mock('@/lib/select/stockholm-date', async () => {
  const actual = await vi.importActual<typeof import('@/lib/select/stockholm-date')>(
    '@/lib/select/stockholm-date',
  )
  return {...actual, stockholmToday: () => '2026-09-05'}
})

import {getWriteClient} from '@/lib/sanity/write-client'
import {sharePublishedExtra} from '@/lib/facebook/published'
import {POST} from './route'

const preview = {
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

function request() {
  return new Request('https://www.kycklingbladet.com/api/extra-extra/publish', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({preview}),
  })
}

describe('extra extra publish Facebook', () => {
  beforeEach(() => {
    vi.mocked(getWriteClient).mockReset()
    vi.mocked(sharePublishedExtra).mockReset()
    vi.mocked(sharePublishedExtra).mockResolvedValue()
  })

  it('shares after a successful create', async () => {
    const create = vi.fn().mockResolvedValue({})
    vi.mocked(getWriteClient).mockReturnValue({
      fetch: vi.fn().mockResolvedValue(null),
      assets: {upload: vi.fn()},
      create,
    } as never)

    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(create).toHaveBeenCalled()
    expect(sharePublishedExtra).toHaveBeenCalledWith('2026-09-05', {
      headline: preview.headline,
      body: preview.body,
      imageCaption: undefined,
      imageUrl: null,
    })
  })

  it('does not share when the date already has Extra Extra', async () => {
    const create = vi.fn()
    vi.mocked(getWriteClient).mockReturnValue({
      fetch: vi.fn().mockResolvedValue('extra-extra-2026-09-05'),
      create,
    } as never)

    const response = await POST(request())
    expect(response.status).toBe(409)
    expect(create).not.toHaveBeenCalled()
    expect(sharePublishedExtra).not.toHaveBeenCalled()
  })
})
