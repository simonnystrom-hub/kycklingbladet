import {describe, expect, it} from 'vitest'
import {envSecret} from './env-secret'

describe('envSecret', () => {
  it('trims surrounding whitespace and newlines', () => {
    expect(envSecret('  sk_live\n')).toBe('sk_live')
    expect(envSecret('\r\nsk_live\r\n')).toBe('sk_live')
  })

  it('unwraps matching quotes', () => {
    expect(envSecret('"sk_live"')).toBe('sk_live')
    expect(envSecret("'sk_live'")).toBe('sk_live')
  })

  it('strips a leading BOM', () => {
    expect(envSecret('\uFEFFsk_live')).toBe('sk_live')
  })

  it('returns empty for missing values', () => {
    expect(envSecret(undefined)).toBe('')
    expect(envSecret(null)).toBe('')
    expect(envSecret('   ')).toBe('')
  })
})
