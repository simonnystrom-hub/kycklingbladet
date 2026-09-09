import {describe, expect, it} from 'vitest'
import {appendMentions, normalizeMentions} from './mentions'

describe('normalizeMentions', () => {
  it('adds @, splits on comma or space, and drops the source user', () => {
    expect(normalizeMentions('svtnyheter,  Expressen  @Kycklingbladet', 'Kycklingbladet')).toEqual([
      '@svtnyheter',
      '@Expressen',
    ])
  })

  it('drops empties and junk without a name', () => {
    expect(normalizeMentions('@@@,   , @', null)).toEqual([])
  })
})

describe('appendMentions', () => {
  it('puts handles at the end', () => {
    expect(appendMentions('Kackel i luckan.', ['@svtnyheter', '@Expressen'])).toBe(
      'Kackel i luckan.\n\n@svtnyheter @Expressen',
    )
  })

  it('returns the text unchanged when there are no mentions', () => {
    expect(appendMentions('Kackel.', [])).toBe('Kackel.')
  })
})
