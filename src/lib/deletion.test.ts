import {describe, expect, it} from 'vitest'
import {DELETION_INTRO, DELETION_SECTIONS} from './deletion'

describe('deletion instructions', () => {
  it('explains contact deletion and that there is no Facebook login', () => {
    const blob = [
      DELETION_INTRO,
      ...DELETION_SECTIONS.flatMap((section) => section.paragraphs),
    ].join('\n')
    expect(blob).toContain('kontaktsidan')
    expect(blob).toContain('ingen Facebook-inloggning')
    expect(blob).toContain('raderas')
  })
})
