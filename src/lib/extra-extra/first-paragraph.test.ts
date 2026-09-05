import {describe, expect, it} from 'vitest'
import {firstExtraParagraph} from './first-paragraph'

describe('firstExtraParagraph', () => {
  it('returns the first non-empty paragraph', () => {
    expect(firstExtraParagraph('Första.\n\nAndra.')).toBe('Första.')
  })

  it('returns the whole body when there is one paragraph', () => {
    expect(firstExtraParagraph('Bara ett stycke.')).toBe('Bara ett stycke.')
  })
})
