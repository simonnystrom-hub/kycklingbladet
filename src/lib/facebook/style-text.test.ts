import {describe, expect, it} from 'vitest'
import {facebookBold, facebookBoldCaps, facebookItalic, formatFacebookBody, stripLeadingExtraExtra} from './style-text'

describe('facebookBoldCaps', () => {
  it('uppercases Swedish and maps Latin letters to sans-serif bold', () => {
    const styled = facebookBoldCaps('Räven vid luckan')
    expect(styled.startsWith('𝗥')).toBe(true)
    expect(styled).toContain('Ä')
    expect(styled).not.toMatch(/[a-z]/)
  })
})

describe('facebookBold', () => {
  it('maps Latin letters to sans-serif bold without uppercasing', () => {
    const styled = facebookBold('Högsta hönset')
    expect(styled.startsWith('𝗛')).toBe(true)
    expect(styled).toContain('ö')
    expect(styled).not.toBe(facebookBoldCaps('Högsta hönset'))
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

describe('stripLeadingExtraExtra', () => {
  it('removes a leading EXTRA EXTRA before the first sentence', () => {
    expect(stripLeadingExtraExtra('EXTRA EXTRA Efter månader av rävanfall.')).toBe(
      'Efter månader av rävanfall.',
    )
  })

  it('removes a leading EXTRA EXTRA paragraph', () => {
    expect(stripLeadingExtraExtra('EXTRA EXTRA\n\nHackandet tystnar.')).toBe('Hackandet tystnar.')
  })

  it('leaves EXTRA EXTRA later in the text', () => {
    expect(stripLeadingExtraExtra('Hackandet tystnar. EXTRA EXTRA sa hönan.')).toBe(
      'Hackandet tystnar. EXTRA EXTRA sa hönan.',
    )
  })
})
