import {afterEach, describe, expect, it, vi} from 'vitest'
import {scrapeArticleHeadline} from './scrape'

afterEach(() => vi.unstubAllGlobals())

describe('scrapeArticleHeadline', () => {
  it('returns cleaned og:title for a known host', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<meta property="og:title" content="Syltstoppet | Expressen">', {status: 200}),
      ),
    )
    await expect(scrapeArticleHeadline('https://www.expressen.se/nyheter/x/')).resolves.toEqual({
      headline: 'Syltstoppet',
      paper: {name: 'Expressen', slug: 'expressen'},
    })
  })

  it('rejects unknown hosts without fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(scrapeArticleHeadline('https://example.com/x')).rejects.toThrow('Okänd tidning')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
