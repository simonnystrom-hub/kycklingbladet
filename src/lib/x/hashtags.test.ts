import {describe, expect, it} from 'vitest'
import {parseHashtagSuggestions, xHashtagLine} from './hashtags'

describe('parseHashtagSuggestions', () => {
  it('normalizes, transliterates Swedish letters, and drops svpol', () => {
    expect(
      parseHashtagSuggestions(['#NATO', 'Försvar', 'svpol', 'ö', 'klimatpolitik-nu']),
    ).toEqual(['nato', 'forsvar', 'klimatpolitiknu'])
  })

  it('reads a space-separated field and caps extras at three', () => {
    expect(parseHashtagSuggestions('#svpol #migpol #eu #nato #klimat')).toEqual([
      'migpol',
      'eu',
      'nato',
    ])
  })

  it('returns nothing for junk', () => {
    expect(parseHashtagSuggestions(null)).toEqual([])
    expect(parseHashtagSuggestions(['#', '1', 'a'])).toEqual([])
  })
})

describe('xHashtagLine', () => {
  it('always leads with #svpol', () => {
    expect(xHashtagLine()).toBe('#svpol')
    expect(xHashtagLine(['svpol'])).toBe('#svpol')
    expect(xHashtagLine(['nato', 'forsvar'])).toBe('#svpol #nato #forsvar')
  })
})
