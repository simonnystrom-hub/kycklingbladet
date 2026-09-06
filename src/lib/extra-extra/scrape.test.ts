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

  it('scrapes unknown hosts and names the paper from the domain', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<meta property="og:title" content="Chock i stan | GP">', {status: 200}),
      ),
    )
    await expect(scrapeArticleHeadline('https://www.gp.se/nyheter/x')).resolves.toEqual({
      headline: 'Chock i stan',
      paper: {name: 'GP', slug: 'gp'},
    })
  })
})
