import {beforeEach, describe, expect, it, vi} from 'vitest'
import {drawExtraImage} from '@/lib/extra-extra/draw'

vi.mock('@/lib/extra-extra/draw', () => ({drawExtraImage: vi.fn()}))
vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}))

import {getWriteClient} from '@/lib/sanity/write-client'
import {attachLeadImage} from './attach-image'

const brief = {
  shotType: 'incident' as const,
  caption: 'Tuppen Gösta vid luckan i går kväll.',
  scenePrompt: 'A rooster by a hatch.',
}

describe('attachLeadImage', () => {
  beforeEach(() => {
    vi.mocked(drawExtraImage).mockReset()
    vi.mocked(getWriteClient).mockReset()
  })

  it('does not call Gemini or patch when brief is null', async () => {
    await expect(attachLeadImage({id: 'alarm-1', date: '2026-09-05', brief: null})).resolves.toEqual({
      image: null,
      imageError: null,
    })
    expect(drawExtraImage).not.toHaveBeenCalled()
  })

  it('does not patch when Gemini fails', async () => {
    vi.mocked(drawExtraImage).mockResolvedValue({image: null, imageError: 'Kunde inte rita bilden'})
    const patch = vi.fn()
    vi.mocked(getWriteClient).mockReturnValue({assets: {upload: vi.fn()}, patch} as never)
    await expect(attachLeadImage({id: 'alarm-1', date: '2026-09-05', brief})).resolves.toEqual({
      image: null,
      imageError: 'Kunde inte rita bilden',
    })
    expect(patch).not.toHaveBeenCalled()
  })

  it('uploads lead-{date}.jpg and patches image fields', async () => {
    vi.mocked(drawExtraImage).mockResolvedValue({
      image: {mimeType: 'image/jpeg', base64: Buffer.from('jpeg').toString('base64')},
      imageError: null,
    })
    const upload = vi.fn().mockResolvedValue({_id: 'image-1'})
    const commit = vi.fn().mockResolvedValue({})
    const set = vi.fn(() => ({commit}))
    const patch = vi.fn(() => ({set}))
    vi.mocked(getWriteClient).mockReturnValue({assets: {upload}, patch} as never)

    await expect(attachLeadImage({id: 'alarm-1', date: '2026-09-05', brief})).resolves.toEqual({
      image: {mimeType: 'image/jpeg', base64: Buffer.from('jpeg').toString('base64')},
      imageError: null,
    })
    expect(upload).toHaveBeenCalledWith(
      'image',
      expect.any(Buffer),
      {filename: 'lead-2026-09-05.jpg', contentType: 'image/jpeg'},
    )
    expect(patch).toHaveBeenCalledWith('alarm-1')
    expect(set).toHaveBeenCalledWith({
      image: {_type: 'image', asset: {_type: 'reference', _ref: 'image-1'}},
      imageCaption: brief.caption,
      imageShotType: brief.shotType,
      imagePrompt: brief.scenePrompt,
    })
  })

  it('strips drafts. from the id before patch', async () => {
    vi.mocked(drawExtraImage).mockResolvedValue({
      image: {mimeType: 'image/jpeg', base64: Buffer.from('jpeg').toString('base64')},
      imageError: null,
    })
    const upload = vi.fn().mockResolvedValue({_id: 'image-1'})
    const commit = vi.fn().mockResolvedValue({})
    const set = vi.fn(() => ({commit}))
    const patch = vi.fn(() => ({set}))
    vi.mocked(getWriteClient).mockReturnValue({assets: {upload}, patch} as never)

    await attachLeadImage({id: 'drafts.alarm-1', date: '2026-09-05', brief})
    expect(patch).toHaveBeenCalledWith('alarm-1')
  })
})
