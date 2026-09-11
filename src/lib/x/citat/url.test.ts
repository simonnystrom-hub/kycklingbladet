import {describe, expect, it} from 'vitest'
import {
  citatFollowUpText,
  citatParentText,
  parseTweetStatusId,
  parseTweetUsername,
} from './url'

describe('parseTweetStatusId', () => {
  it('reads x.com and twitter.com status ids', () => {
    expect(parseTweetStatusId('https://x.com/Kycklingbladet/status/2097812376640696829')).toBe(
      '2097812376640696829',
    )
    expect(
      parseTweetStatusId('https://www.twitter.com/someone/status/12345?s=20'),
    ).toBe('12345')
    expect(parseTweetStatusId('https://x.com/i/status/12345')).toBe('12345')
    expect(parseTweetStatusId('https://x.com/i/web/status/12345')).toBe('12345')
    expect(parseTweetStatusId('https://x.com/someone/status/12345/photo/1')).toBe('12345')
  })

  it('rejects junk', () => {
    expect(parseTweetStatusId('https://x.com/Kycklingbladet')).toBeNull()
    expect(parseTweetStatusId('not a url')).toBeNull()
    expect(parseTweetStatusId('https://www.kycklingbladet.com/status/1')).toBeNull()
  })
})

describe('parseTweetUsername / citatParentText', () => {
  it('keeps the handle from the status URL', () => {
    expect(
      parseTweetUsername(
        'https://x.com/SDTobbe/status/2097999724544454657?s=20',
      ),
    ).toBe('SDTobbe')
    expect(parseTweetUsername('https://x.com/i/web/status/12345')).toBeNull()
    expect(parseTweetUsername('https://x.com/i/status/12345')).toBeNull()
  })

  it('appends Inspirerad av to the hen tweet', () => {
    expect(
      citatParentText(
        '  Kackel i luckan.  ',
        'https://x.com/SDTobbe/status/2097999724544454657?s=20',
      ),
    ).toBe('"Kackel i luckan."\n\nInspirerad av @SDTobbe')
    expect(
      citatParentText(
        '"Kackel i luckan."',
        'https://x.com/SDTobbe/status/2097999724544454657?s=20',
      ),
    ).toBe('"Kackel i luckan."\n\nInspirerad av @SDTobbe')
    expect(
      citatParentText(
        'Cluck in the hatch.',
        'https://x.com/SDTobbe/status/2097999724544454657?s=20',
        'en',
      ),
    ).toBe('"Cluck in the hatch."\n\nInspired by @SDTobbe')
  })
})

describe('citatFollowUpText', () => {
  it('posts Källa and the URL', () => {
    expect(citatFollowUpText('  https://x.com/jack/status/20  ')).toBe(
      'Källa:\nhttps://x.com/jack/status/20',
    )
    expect(citatFollowUpText('https://x.com/Kycklingbladet')).toBeNull()
  })

  it('puts extra mentions first, then Källa and the URL', () => {
    expect(
      citatFollowUpText('https://x.com/SDTobbe/status/2097999724544454657?s=20', [
        '@svtnyheter',
      ]),
    ).toBe(
      '@svtnyheter\nKälla:\nhttps://x.com/SDTobbe/status/2097999724544454657?s=20',
    )
    expect(
      citatFollowUpText(
        'https://x.com/SDTobbe/status/2097999724544454657?s=20',
        ['@svtnyheter'],
        'en',
      ),
    ).toBe(
      '@svtnyheter\nSource:\nhttps://x.com/SDTobbe/status/2097999724544454657?s=20',
    )
  })
})
