import {afterEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}))
vi.mock('./share', () => ({
  shareToFacebook: vi.fn(),
}))
vi.mock('@/lib/x/share', () => ({
  shareToX: vi.fn(),
}))

import {getWriteClient} from '@/lib/sanity/write-client'
import {shareToX} from '@/lib/x/share'
import {xExtraMessage, xLeadMessage} from '@/lib/x/message'
import {shareToFacebook} from './share'
import {sharePublishedExtra, sharePublishedLead} from './published'
import {facebookExtraMessage, facebookLeadMessage} from './message'

describe('sharePublishedLead', () => {
  afterEach(() => {
    vi.mocked(getWriteClient).mockReset()
    vi.mocked(shareToFacebook).mockReset()
    vi.mocked(shareToX).mockReset()
  })

  it('shares the fetched lead to Facebook and X', async () => {
    const alarm = {
      date: '2026-09-05',
      slug: 'luckan',
      headline: 'Larmrubrik',
      body: 'Brödtext.',
      expertVoice: 'Högsta hönset',
      expertHeadline: 'Analys',
      expertText: 'Trygghet.',
      imageCaption: 'Hönan.',
      imageUrl: 'https://cdn.sanity.io/lead.jpg',
    }
    const articleUrl = 'https://www.kycklingbladet.com/arkiv/2026-09-05/luckan'
    vi.mocked(getWriteClient).mockReturnValue({
      fetch: vi.fn().mockResolvedValue(alarm),
    } as never)
    vi.mocked(shareToFacebook).mockResolvedValue('shared')
    vi.mocked(shareToX).mockResolvedValue('shared')

    await sharePublishedLead('alarm-2026-09-05')

    expect(shareToFacebook).toHaveBeenCalledWith({
      message: facebookLeadMessage(alarm),
      imageUrl: 'https://cdn.sanity.io/lead.jpg',
      articleUrl,
    })
    expect(shareToX).toHaveBeenCalledWith({
      text: xLeadMessage(alarm, articleUrl, alarm.xHashtags),
      imageUrl: 'https://cdn.sanity.io/lead.jpg',
    })
  })

  it('does not share when the lead is missing', async () => {
    vi.mocked(getWriteClient).mockReturnValue({
      fetch: vi.fn().mockResolvedValue(null),
    } as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await sharePublishedLead('alarm-2026-09-05')

    expect(shareToFacebook).not.toHaveBeenCalled()
    expect(shareToX).not.toHaveBeenCalled()
  })

  it('still posts to Facebook when X fails', async () => {
    const alarm = {
      date: '2026-09-05',
      slug: 'luckan',
      headline: 'Larmrubrik',
      body: 'Brödtext.',
      imageUrl: 'https://cdn.sanity.io/lead.jpg',
    }
    vi.mocked(getWriteClient).mockReturnValue({
      fetch: vi.fn().mockResolvedValue(alarm),
    } as never)
    vi.mocked(shareToFacebook).mockResolvedValue('shared')
    vi.mocked(shareToX).mockResolvedValue('failed')

    await expect(sharePublishedLead('alarm-2026-09-05')).resolves.toBe('shared')
    expect(shareToFacebook).toHaveBeenCalled()
  })
})

describe('sharePublishedExtra', () => {
  afterEach(() => {
    vi.mocked(shareToFacebook).mockReset()
    vi.mocked(shareToX).mockReset()
  })

  it('shares Extra Extra to Facebook and X', async () => {
    const extra = {
      id: 'extra-extra-2026-09-05-2',
      headline: 'Flash',
      body: 'Hela gården håller andan.',
      imageCaption: 'Tuppen.',
      imageUrl: 'https://cdn.sanity.io/extra.jpg',
    }
    const articleUrl = 'https://www.kycklingbladet.com/extra-extra/2026-09-05#extra-extra-2026-09-05-2'
    vi.mocked(shareToFacebook).mockResolvedValue('shared')
    vi.mocked(shareToX).mockResolvedValue('shared')

    await sharePublishedExtra('2026-09-05', extra)

    expect(shareToFacebook).toHaveBeenCalledWith({
      message: facebookExtraMessage(extra),
      imageUrl: extra.imageUrl,
      articleUrl,
    })
    expect(shareToX).toHaveBeenCalledWith({
      text: xExtraMessage(extra, articleUrl, extra.xHashtags),
      imageUrl: extra.imageUrl,
    })
  })
})
