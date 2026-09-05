import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {ExtraImageBrief} from '@/lib/generate/extra-image'

const generateExtraJpeg = vi.fn()

vi.mock('./gemini', () => ({
  generateExtraJpeg,
}))

const brief: ExtraImageBrief = {
  shotType: 'incident',
  caption: 'Tuppen Gösta vid luckan.',
  scenePrompt: 'A rooster by a hatch.',
}

describe('drawExtraImage', () => {
  beforeEach(() => {
    vi.resetModules()
    generateExtraJpeg.mockReset()
  })

  it('returns null image without calling Gemini when brief is null', async () => {
    const {drawExtraImage} = await import('./draw')
    const result = await drawExtraImage(null)
    expect(result).toEqual({image: null, imageError: null})
    expect(generateExtraJpeg).not.toHaveBeenCalled()
  })

  it('returns jpeg base64 on success', async () => {
    const jpegBytes = Buffer.from('jpeg-data')
    generateExtraJpeg.mockResolvedValue(jpegBytes)
    const {drawExtraImage} = await import('./draw')
    const result = await drawExtraImage(brief)
    expect(result.image).toEqual({
      mimeType: 'image/jpeg',
      base64: jpegBytes.toString('base64'),
    })
    expect(result.imageError).toBeNull()
    expect(generateExtraJpeg).toHaveBeenCalledOnce()
  })

  it('returns imageError on failure without throwing', async () => {
    generateExtraJpeg.mockRejectedValue(new Error('Kunde inte rita bilden'))
    const {drawExtraImage} = await import('./draw')
    const result = await drawExtraImage(brief)
    expect(result).toEqual({image: null, imageError: 'Kunde inte rita bilden'})
  })
})
