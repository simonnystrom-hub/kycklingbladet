import {describe, expect, it} from 'vitest'
import {validateGeneratedExtra} from './extra'

describe('validateGeneratedExtra', () => {
  it('requires headline and body', () => {
    expect(validateGeneratedExtra({headline: 'Luckan', body: 'Kacklet tystnade.'})).toEqual({
      headline: 'Luckan',
      body: 'Kacklet tystnade.',
      imageBrief: null,
      hashtags: [],
    })
    expect(validateGeneratedExtra({headline: '', body: 'x'})).toBeNull()
    expect(validateGeneratedExtra({headline: 'Luckan', body: 'Hon sa «nu».'})).toEqual({
      headline: 'Luckan',
      body: 'Hon sa "nu".',
      imageBrief: null,
      hashtags: [],
    })
  })

  it('attaches a valid image brief and ignores a bad one', () => {
    expect(
      validateGeneratedExtra({
        headline: 'Luckan',
        body: 'Kacklet tystnade.',
        imageShotType: 'incident',
        imageCaption: 'Tuppen Gösta vid luckan i går kväll.',
        imagePrompt: 'Rooster at the hatch.',
      }),
    ).toEqual({
      headline: 'Luckan',
      body: 'Kacklet tystnade.',
      imageBrief: {
        shotType: 'incident',
        caption: 'Tuppen Gösta vid luckan i går kväll.',
        scenePrompt: 'Rooster at the hatch.',
      },
      hashtags: [],
    })
    expect(validateGeneratedExtra({headline: 'Luckan', body: 'Kacklet tystnade.'})).toEqual({
      headline: 'Luckan',
      body: 'Kacklet tystnade.',
      imageBrief: null,
      hashtags: [],
    })
    expect(
      validateGeneratedExtra({
        headline: 'Luckan',
        body: 'Kacklet tystnade.',
        hashtags: ['#Försvar', 'svpol', 'nato'],
      })?.hashtags,
    ).toEqual(['forsvar', 'nato'])
  })
})
