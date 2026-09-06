import {describe, expect, it} from 'vitest'
import {
  buildGeminiImagePrompt,
  EXTRA_IMAGE_SIGNATURE,
  EXTRA_IMAGE_STYLE,
  parseExtraImageShotType,
  validateExtraImageBrief,
} from './extra-image'

describe('parseExtraImageShotType', () => {
  it('accepts the three locked types', () => {
    expect(parseExtraImageShotType('intervju')).toBe('intervju')
    expect(parseExtraImageShotType('incident')).toBe('incident')
    expect(parseExtraImageShotType('annat')).toBe('annat')
    expect(parseExtraImageShotType('portrait')).toBeNull()
    expect(parseExtraImageShotType('')).toBeNull()
  })
})

describe('validateExtraImageBrief', () => {
  const brief = {
    imageShotType: 'incident',
    imageCaption: 'Tuppen Gösta vid luckan i går kväll.',
    imagePrompt: 'A rooster by a henhouse hatch at night, simple panel.',
  }

  it('returns shot type, caption, and scene prompt', () => {
    expect(validateExtraImageBrief(brief)).toEqual({
      shotType: 'incident',
      caption: 'Tuppen Gösta vid luckan i går kväll.',
      scenePrompt: 'A rooster by a henhouse hatch at night, simple panel.',
    })
  })

  it('rejects missing caption or scene', () => {
    expect(validateExtraImageBrief({...brief, imageCaption: ''})).toBeNull()
    expect(validateExtraImageBrief({...brief, imagePrompt: ''})).toBeNull()
    expect(validateExtraImageBrief({...brief, imageShotType: 'foto'})).toBeNull()
  })
})

describe('EXTRA_IMAGE_STYLE', () => {
  it('locks Berglin/Larson, monochrome, hens only, Kycklingbladet.com signature', () => {
    expect(EXTRA_IMAGE_STYLE).toMatch(/Berglin/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/Larson/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/monochrome|black-and-white|grayscale/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/no humans/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/hens|roosters/i)
    expect(EXTRA_IMAGE_STYLE).toContain(EXTRA_IMAGE_SIGNATURE)
    expect(EXTRA_IMAGE_STYLE).toMatch(/Never sign Larson/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/no other text|no letters|no speech/i)
  })
})

describe('buildGeminiImagePrompt', () => {
  it('includes the locked style, shot type, and scene', () => {
    const prompt = buildGeminiImagePrompt({
      shotType: 'intervju',
      caption: 'Hönan Bodil i hönshuset.',
      scenePrompt: 'A hen interviewed beside a grain bin.',
    })
    expect(prompt).toContain(EXTRA_IMAGE_STYLE)
    expect(prompt).toContain('intervju')
    expect(prompt).toContain('A hen interviewed beside a grain bin.')
    expect(prompt).not.toContain('Hönan Bodil i hönshuset.')
    expect(prompt).toMatch(/zero readable language/i)
    expect(prompt).toContain(EXTRA_IMAGE_SIGNATURE)
  })
})
