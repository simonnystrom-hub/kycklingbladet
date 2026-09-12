import {describe, expect, it} from 'vitest'
import {validateCitatSpeechBubble, validateGeneratedCitat} from './parse'

describe('validateGeneratedCitat', () => {
  it('reads text and the image brief', () => {
    const got = validateGeneratedCitat({
      text: 'Räven utanför luckan igen.',
      imageShotType: 'incident',
      imageCaption: 'Hönan vid tråget.',
      imagePrompt: 'A hen staring at a fox by the coop door.',
    })
    expect(got?.text).toBe('"Räven utanför luckan igen."')
    expect(got?.imageBrief?.shotType).toBe('incident')
    expect(got?.hashtags).toEqual([])
  })

  it('normalizes extra hashtags and drops svpol', () => {
    expect(
      validateGeneratedCitat({
        text: 'Räven utanför luckan igen.',
        hashtags: ['#Försvar', 'svpol', 'nato'],
      })?.hashtags,
    ).toEqual(['forsvar', 'nato'])
  })

  it('does not double-wrap existing quotes', () => {
    expect(validateGeneratedCitat({text: '"Redan citerat."'})?.text).toBe('"Redan citerat."')
  })

  it('returns null without text', () => {
    expect(validateGeneratedCitat({text: '  '})).toBeNull()
  })
})

describe('validateCitatSpeechBubble', () => {
  it('accepts a short hen line', () => {
    expect(validateCitatSpeechBubble({text: '  Kackel i redet!  '})).toBe('Kackel i redet!')
  })

  it('rejects empty, URL, mention and overlong lines', () => {
    expect(validateCitatSpeechBubble({text: ''})).toBeNull()
    expect(validateCitatSpeechBubble({text: 'Se https://x.com/x'})).toBeNull()
    expect(validateCitatSpeechBubble({text: 'Hej @besokare'})).toBeNull()
    expect(validateCitatSpeechBubble({text: 'Ett'})).toBeNull()
  })
})
