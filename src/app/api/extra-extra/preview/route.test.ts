import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/extra-extra/auth', () => ({
  extraExtraSecretOk: vi.fn(() => true),
  corsHeaders: () => ({}),
}))
vi.mock('@/lib/extra-extra/scrape', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/extra-extra/scrape')>()
  return {
    ...actual,
    scrapeArticleHeadline: vi.fn(),
  }
})
vi.mock('@/lib/generate/claude-extra', () => ({
  generateExtra: vi.fn(),
}))
vi.mock('@/lib/extra-extra/draw', () => ({
  drawExtraImage: vi.fn(),
}))

import {drawExtraImage} from '@/lib/extra-extra/draw'
import {scrapeArticleHeadline} from '@/lib/extra-extra/scrape'
import {generateExtra} from '@/lib/generate/claude-extra'
import {maxDuration, OPTIONS, POST} from './route'

function request(payload: unknown) {
  return new Request('https://www.kycklingbladet.com/api/extra-extra/preview', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })
}

describe('preview route', () => {
  beforeEach(() => {
    vi.mocked(scrapeArticleHeadline).mockReset()
    vi.mocked(scrapeArticleHeadline).mockResolvedValue({
      headline: 'Syltstoppet',
      paper: {name: 'Expressen', slug: 'expressen'},
    })
    vi.mocked(generateExtra).mockReset()
    vi.mocked(generateExtra).mockResolvedValue({
      generated: {
        headline: 'Hönor utan sylt',
        body: 'Kackel i redet.',
        imageBrief: {
          shotType: 'incident' as const,
          caption: 'Hönor vid luckan.',
          scenePrompt: 'Chickens at a hatch.',
        },
        hashtags: [],
      },
      promptVersion: 'v1',
      modelVersion: 'claude-test',
    })
    vi.mocked(drawExtraImage).mockReset()
  })

  it('exports HTTP handlers and a 60s duration budget', () => {
    expect(typeof OPTIONS).toBe('function')
    expect(typeof POST).toBe('function')
    expect(maxDuration).toBe(60)
  })

  it('scrapes once and returns copy without drawing', async () => {
    const response = await POST(request({url: 'https://www.expressen.se/nyheter/x/'}))

    expect(response.status).toBe(200)
    expect(scrapeArticleHeadline).toHaveBeenCalledOnce()
    expect(drawExtraImage).not.toHaveBeenCalled()
    expect(await response.json()).toEqual({
      preview: {
        kicker: 'EXTRA EXTRA',
        headline: 'Hönor utan sylt',
        body: 'Kackel i redet.',
        sourceUrl: 'https://www.expressen.se/nyheter/x/',
        sourceHeadline: 'Syltstoppet',
        sourceNewspaper: 'Expressen',
        sourceNewspaperSlug: 'expressen',
        promptVersion: 'v1',
        modelVersion: 'claude-test',
        imageShotType: 'incident',
        imageCaption: 'Hönor vid luckan.',
        imagePrompt: 'Chickens at a hatch.',
        xHashtags: '#svpol',
      },
    })
  })

  it('reuses a cached headline instead of scraping', async () => {
    const response = await POST(
      request({
        url: 'https://www.expressen.se/nyheter/x/',
        sourceHeadline: 'Sparad rubrik',
        dumhet: 4,
        uppskruvning: 2,
      }),
    )

    expect(response.status).toBe(200)
    expect(scrapeArticleHeadline).not.toHaveBeenCalled()
    expect(generateExtra).toHaveBeenCalledWith({
      text: 'Sparad rubrik',
      newspaperName: 'Expressen',
      dumhet: 4,
      uppskruvning: 2,
    })
    expect((await response.json()).preview.sourceHeadline).toBe('Sparad rubrik')
  })
})
