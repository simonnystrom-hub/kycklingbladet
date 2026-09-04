import { describe, expect, it } from 'vitest'
import { EXPERT_VOICES } from './experts'
import { parseGeneratedAlarm } from './parse'
import { validateGeneratedAlarm } from './validate'

const good = {
  kicker: 'Dagens skrämchock',
  headline: 'Niohundra fast. Luckan gick i baklås.',
  body: 'Niohundra höns satt fast i den massiva dödsfällan.\n\nDunungarna pipade under brädan.',
  expertVoice: 'Överhönan',
  expertHeadline: 'varnar: Kan bli mycket värre',
  expertText: 'Sitt inte med ryggen mot luckan. När kacklet tystnar bakifrån är det redan för sent att räkna till niohundra.',
}

describe('validateGeneratedAlarm', () => {
  it('accepts a complete payload', () => {
    expect(validateGeneratedAlarm(good)).toEqual(good)
  })

  it('rejects missing kicker, headline, body, or expert fields', () => {
    expect(validateGeneratedAlarm({ ...good, kicker: '' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, headline: '   ' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, body: '' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, expertVoice: '' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, expertHeadline: '' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, expertText: '' })).toBeNull()
    expect(validateGeneratedAlarm({ kicker: 'x', headline: 'y', body: 'z' })).toBeNull()
    expect(validateGeneratedAlarm(null)).toBeNull()
    expect(validateGeneratedAlarm('nope')).toBeNull()
  })

  it('rejects an unknown expert voice', () => {
    expect(validateGeneratedAlarm({ ...good, expertVoice: 'Göran' })).toBeNull()
  })

  it('accepts each locked expert voice', () => {
    for (const expertVoice of EXPERT_VOICES) {
      expect(validateGeneratedAlarm({ ...good, expertVoice })?.expertVoice).toBe(expertVoice)
    }
  })

  it('trims string fields', () => {
    const result = validateGeneratedAlarm({
      ...good,
      kicker: '  Extra kackel  ',
    })
    expect(result?.kicker).toBe('Extra kackel')
  })

  it('turns guillemets into straight quotes', () => {
    const result = validateGeneratedAlarm({
      ...good,
      body: 'Hon sa «det bär».',
    })
    expect(result?.body).toBe('Hon sa "det bär".')
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
