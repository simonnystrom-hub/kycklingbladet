import {describe, expect, it} from 'vitest'
import {parseVisdomsordDrafts} from './parse'

describe('parseVisdomsordDrafts', () => {
  it('parses a JSON array from a fenced response', () => {
    const text = [
      'Här kommer svaret:',
      '```json',
      '[{"quote":"Kackla först.","henName":"Hedvig Höna"}]',
      '```',
    ].join('\n')

    expect(parseVisdomsordDrafts(text)).toEqual([
      {quote: 'Kackla först.', henName: 'Hedvig Höna'},
    ])
  })

  it('extracts the first JSON array from surrounding text', () => {
    expect(
      parseVisdomsordDrafts(
        'Inledning [{"quote":"Sitt på pinnen.","henName":"Rut"}] avslutning',
      ),
    ).toEqual([{quote: 'Sitt på pinnen.', henName: 'Rut'}])
  })

  it('drops invalid items and trims valid strings', () => {
    const text = JSON.stringify([
      {quote: '  Korn väger lätt.  ', henName: '  Agda  '},
      {quote: '', henName: 'Rut'},
      {quote: 'Giltigt', henName: 7},
      null,
    ])

    expect(parseVisdomsordDrafts(text)).toEqual([
      {quote: 'Korn väger lätt.', henName: 'Agda'},
    ])
  })

  it('returns an empty array for invalid JSON', () => {
    expect(parseVisdomsordDrafts('[{"quote":]')).toEqual([])
  })
})
