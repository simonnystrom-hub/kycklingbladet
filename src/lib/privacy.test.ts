import {describe, expect, it} from 'vitest'
import {PRIVACY_INTRO, PRIVACY_SECTIONS} from './privacy'

describe('privacy copy', () => {
  it('covers GDPR, contact, and IMY', () => {
    const blob = [PRIVACY_INTRO, ...PRIVACY_SECTIONS.flatMap((section) => section.paragraphs)].join(
      '\n',
    )
    expect(blob).toContain('GDPR')
    expect(blob).toContain('kontaktsidan')
    expect(blob).toContain('Integritetsskyddsmyndigheten')
    expect(blob).toMatch(/artikel 6\.1/)
  })
})
