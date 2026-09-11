import {describe, expect, it} from 'vitest'
import {normalizeQuotes, wrapStraightQuotes} from './quotes'

describe('normalizeQuotes', () => {
  it('turns guillemets into straight quotes', () => {
    expect(normalizeQuotes('Han sa «det bär» och gick.')).toBe('Han sa "det bär" och gick.')
  })
})

describe('wrapStraightQuotes', () => {
  it('wraps bare text and leaves existing straight quotes', () => {
    expect(wrapStraightQuotes('  Kackel i luckan.  ')).toBe('"Kackel i luckan."')
    expect(wrapStraightQuotes('"Kackel i luckan."')).toBe('"Kackel i luckan."')
    expect(wrapStraightQuotes('“Kackel i luckan.”')).toBe('"Kackel i luckan."')
  })
})
