import {describe, expect, it} from 'vitest'
import {extraExtraId} from './id'

describe('extraExtraId', () => {
  it('prefixes the ISO date', () => {
    expect(extraExtraId('2026-09-05')).toBe('extra-extra-2026-09-05')
  })
})
