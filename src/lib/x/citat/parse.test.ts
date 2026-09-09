import {describe, expect, it} from 'vitest'
import {validateGeneratedCitat} from './parse'

describe('validateGeneratedCitat', () => {
  it('reads text and the image brief', () => {
    const got = validateGeneratedCitat({
      text: 'Räven utanför luckan igen.',
      imageShotType: 'incident',
      imageCaption: 'Hönan vid tråget.',
      imagePrompt: 'A hen staring at a fox by the coop door.',
    })
    expect(got?.text).toBe('Räven utanför luckan igen.')
    expect(got?.imageBrief?.shotType).toBe('incident')
  })

  it('returns null without text', () => {
    expect(validateGeneratedCitat({text: '  '})).toBeNull()
  })
})
