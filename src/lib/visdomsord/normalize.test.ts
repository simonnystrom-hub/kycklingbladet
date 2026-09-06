import {describe, expect, it} from 'vitest'
import {normalizeQuoteKey} from './normalize'

describe('normalizeQuoteKey', () => {
  it('treats wrapping quotes, extra spaces, case and trailing punctuation as the same', () => {
    expect(normalizeQuoteKey('  "Sitt inte med ryggen mot luckan!" ')).toBe(
      normalizeQuoteKey('sitt inte med ryggen mot luckan'),
    )
  })

  it('strips typographic wrapping quotes', () => {
    expect(normalizeQuoteKey('“Sitt inte med ryggen mot luckan.”')).toBe(
      normalizeQuoteKey('sitt inte med ryggen mot luckan'),
    )
  })

  it('keeps genuinely different quotes apart', () => {
    expect(normalizeQuoteKey('Sitt inte med ryggen mot luckan')).not.toBe(
      normalizeQuoteKey('Hacka inte grannens fodertråg'),
    )
  })
})
