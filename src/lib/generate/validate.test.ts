import { describe, expect, it } from 'vitest'
import { parseGeneratedAlarm } from './parse'
import { validateGeneratedAlarm } from './validate'

const good = {
  kicker: 'Dagens skrämchock',
  headline: 'Fem centimeter snö. Nationen faller.',
  body: 'Det började klockan 08.14.\n\nGöran sitter fast i köket.',
  survivalTip: 'Tre lager dun och havre till grannen.',
}

describe('validateGeneratedAlarm', () => {
  it('accepts a complete payload', () => {
    expect(validateGeneratedAlarm(good)).toEqual(good)
  })

  it('rejects missing kicker, headline, body, or survivalTip', () => {
    expect(validateGeneratedAlarm({ ...good, kicker: '' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, headline: '   ' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, body: '' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, survivalTip: '' })).toBeNull()
    expect(validateGeneratedAlarm({ kicker: 'x', headline: 'y', body: 'z' })).toBeNull()
    expect(validateGeneratedAlarm(null)).toBeNull()
    expect(validateGeneratedAlarm('nope')).toBeNull()
  })

  it('trims string fields', () => {
    const result = validateGeneratedAlarm({
      ...good,
      kicker: '  Extra kackel  ',
    })
    expect(result?.kicker).toBe('Extra kackel')
  })
})

describe('parseGeneratedAlarm', () => {
  it('parses a raw JSON object', () => {
    expect(parseGeneratedAlarm(JSON.stringify(good))).toEqual(good)
  })

  it('parses JSON fenced in markdown', () => {
    const text = 'Här är texten:\n```json\n' + JSON.stringify(good) + '\n```\n'
    expect(parseGeneratedAlarm(text)).toEqual(good)
  })

  it('returns null for non-JSON', () => {
    expect(parseGeneratedAlarm('ursäkta jag är en höna')).toBeNull()
  })
})
