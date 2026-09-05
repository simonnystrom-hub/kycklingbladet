import {afterEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}))
vi.mock('./share', () => ({
  shareToFacebook: vi.fn(),
}))

import {getWriteClient} from '@/lib/sanity/write-client'
import {shareToFacebook} from './share'
import {sharePublishedExtra, sharePublishedLead} from './published'
import {facebookExtraMessage, facebookLeadMessage} from './message'

describe('sharePublishedLead', () => {
  afterEach(() => {
    vi.mocked(getWriteClient).mockReset()
    vi.mocked(shareToFacebook).mockReset()
  })

  it('shares the fetched lead to the archive URL', async () => {
    const alarm = {
      headline: 'Larmrubrik',
      body: 'Brödtext.',
      expertVoice: 'Högsta hönset',
      expertHeadline: 'Analys',
      expertText: 'Trygghet.',
      imageCaption: 'Hönan.',
      imageUrl: 'https://cdn.sanity.io/lead.jpg',
      notices: [{headline: 'Notis', body: 'Kort.'}],
    }
    vi.mocked(getWriteClient).mockReturnValue({
      fetch: vi.fn().mockResolvedValue(alarm),
    } as never)
    vi.mocked(shareToFacebook).mockResolvedValue()

    await sharePublishedLead('2026-09-05')

    expect(shareToFacebook).toHaveBeenCalledWith({
      message: facebookLeadMessage(alarm),
      imageUrl: 'https://cdn.sanity.io/lead.jpg',
      articleUrl: 'https://www.kycklingbladet.com/arkiv/2026-09-05',
    })
  })

  it('does not share when the lead is missing', async () => {
    vi.mocked(getWriteClient).mockReturnValue({
      fetch: vi.fn().mockResolvedValue(null),
    } as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await sharePublishedLead('2026-09-05')

    expect(shareToFacebook).not.toHaveBeenCalled()
  })
})

describe('sharePublishedExtra', () => {
  afterEach(() => {
    vi.mocked(shareToFacebook).mockReset()
  })

  it('shares Extra Extra to its canonical URL', async () => {
    const extra = {
      headline: 'Flash',
      body: 'Hela gården håller andan.',
      imageCaption: 'Tuppen.',
      imageUrl: 'https://cdn.sanity.io/extra.jpg',
    }
    vi.mocked(shareToFacebook).mockResolvedValue()

    await sharePublishedExtra('2026-09-05', extra)

    expect(shareToFacebook).toHaveBeenCalledWith({
      message: facebookExtraMessage(extra),
      imageUrl: extra.imageUrl,
      articleUrl: 'https://www.kycklingbladet.com/extra-extra/2026-09-05',
    })
  })
})
