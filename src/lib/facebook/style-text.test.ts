import {describe, expect, it} from 'vitest'
import {facebookBoldCaps, facebookItalic, formatFacebookBody} from './style-text'

describe('facebookBoldCaps', () => {
  it('uppercases Swedish and maps Latin letters to sans-serif bold', () => {
    const styled = facebookBoldCaps('Räven vid luckan')
    expect(styled.startsWith('𝗥')).toBe(true)
    expect(styled).toContain('Ä')
    expect(styled).not.toMatch(/[a-z]/)
  })
})

describe('facebookItalic', () => {
  it('maps Latin letters to sans-serif italic and keeps åäö', () => {
    const styled = facebookItalic('Hönan vid luckan.')
    expect(styled.startsWith('𝘏')).toBe(true)
    expect(styled).toContain('ö')
    expect(styled.endsWith('.')).toBe(true)
  })
})

describe('formatFacebookBody', () => {
  it('trims lines and keeps paragraph breaks', () => {
    expect(formatFacebookBody('  Första.  \n\n\n  Andra.  \n')).toBe('Första.\n\nAndra.')
  })
})
