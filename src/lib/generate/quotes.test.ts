import {describe, expect, it} from 'vitest'
import {normalizeQuotes} from './quotes'

describe('normalizeQuotes', () => {
  it('turns guillemets into straight quotes', () => {
    expect(normalizeQuotes('Han sa «det bär» och gick.')).toBe('Han sa "det bär" och gick.')
  })
})
