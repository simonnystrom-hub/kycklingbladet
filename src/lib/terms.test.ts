import {describe, expect, it} from 'vitest'
import {TERMS_INTRO, TERMS_SECTIONS} from './terms'

describe('terms copy', () => {
  it('states that the site is free satire', () => {
    const blob = [TERMS_INTRO, ...TERMS_SECTIONS.flatMap((section) => section.paragraphs)].join('\n')
    expect(blob).toContain('gratissajt')
    expect(blob).toContain('humor')
    expect(blob).toContain('kontaktsidan')
  })
})
