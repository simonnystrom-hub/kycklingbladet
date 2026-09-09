import {describe, expect, it} from 'vitest'
import {parseTweetStatusId} from './url'

describe('parseTweetStatusId', () => {
  it('reads x.com and twitter.com status ids', () => {
    expect(parseTweetStatusId('https://x.com/Kycklingbladet/status/2097812376640696829')).toBe(
      '2097812376640696829',
    )
    expect(
      parseTweetStatusId('https://www.twitter.com/someone/status/12345?s=20'),
    ).toBe('12345')
  })

  it('rejects junk', () => {
    expect(parseTweetStatusId('https://x.com/Kycklingbladet')).toBeNull()
    expect(parseTweetStatusId('not a url')).toBeNull()
    expect(parseTweetStatusId('https://www.kycklingbladet.com/status/1')).toBeNull()
  })
})
