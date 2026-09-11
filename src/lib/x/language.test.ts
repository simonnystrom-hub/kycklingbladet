import {describe, expect, it} from 'vitest'
import {
  detectXCopyLanguage,
  parseXCopyLanguage,
  resolveXCopyLanguage,
} from './language'

describe('parseXCopyLanguage', () => {
  it('accepts sv and en', () => {
    expect(parseXCopyLanguage('sv')).toBe('sv')
    expect(parseXCopyLanguage('en')).toBe('en')
  })

  it('rejects anything else', () => {
    expect(parseXCopyLanguage('SV')).toBeNull()
    expect(parseXCopyLanguage('english')).toBeNull()
    expect(parseXCopyLanguage(null)).toBeNull()
  })
})

describe('detectXCopyLanguage', () => {
  it('treats empty or uncertain text as Swedish', () => {
    expect(detectXCopyLanguage('')).toBe('sv')
    expect(detectXCopyLanguage('  ')).toBe('sv')
    expect(detectXCopyLanguage('Original tweet')).toBe('sv')
  })

  it('picks Swedish from å/ä/ö even when English words are present', () => {
    expect(detectXCopyLanguage('The fox stole the höns')).toBe('sv')
    expect(detectXCopyLanguage('Räven tog hönsen från redet')).toBe('sv')
  })

  it('picks Swedish from function words', () => {
    expect(detectXCopyLanguage('Det blir presstraff i dag och regeringen har sagt nej')).toBe(
      'sv',
    )
  })

  it('picks English from function words when there are no Swedish letters', () => {
    expect(detectXCopyLanguage('The government announced a new tax today')).toBe('en')
    expect(detectXCopyLanguage('You are not going to believe this')).toBe('en')
  })
})

describe('resolveXCopyLanguage', () => {
  it('lets an explicit button win over detection', () => {
    expect(
      resolveXCopyLanguage({
        text: 'The government announced a new tax today',
        language: 'sv',
      }),
    ).toBe('sv')
    expect(
      resolveXCopyLanguage({
        text: 'Räven tog hönsen',
        language: 'en',
      }),
    ).toBe('en')
  })

  it('detects when no override is set', () => {
    expect(
      resolveXCopyLanguage({text: 'The government announced a new tax today'}),
    ).toBe('en')
  })
})
