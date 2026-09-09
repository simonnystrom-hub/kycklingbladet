import {describe, expect, it} from 'vitest'
import {buildCitatUserPrompt, citatKnobsFromPayload, CITAT_WRITE_SYSTEM} from './prompt'

describe('citatKnobsFromPayload', () => {
  it('is null when knobs are omitted so Claude chooses', () => {
    expect(citatKnobsFromPayload({url: 'https://x.com/a/status/1', text: 'hej'})).toBeNull()
  })

  it('reads dumhet and uppskruvning when both are present', () => {
    expect(citatKnobsFromPayload({dumhet: 5, uppskruvning: 1})).toEqual({
      dumhet: 5,
      uppskruvning: 1,
    })
  })
})

describe('buildCitatUserPrompt', () => {
  it('asks Claude to pick length when knobs are missing', () => {
    const text = buildCitatUserPrompt({text: 'Räven tog hönsen', username: 'Expressen'})
    expect(text).toContain('@Expressen')
    expect(text).toContain('Räven tog hönsen')
    expect(text).toContain('Välj själv')
    expect(text).not.toContain('Dumhet')
  })

  it('includes Extra Extra knob hints when set', () => {
    const text = buildCitatUserPrompt({
      text: 'Räven tog hönsen',
      dumhet: 5,
      uppskruvning: 1,
    })
    expect(text).toContain('Dumhet 5/5')
    expect(text).toContain('Uppskruvning 1/5')
  })
})

describe('CITAT_WRITE_SYSTEM', () => {
  it('is one quote-tweet body, not EXTRA EXTRA', () => {
    expect(CITAT_WRITE_SYSTEM).toContain('citat-tweet')
    expect(CITAT_WRITE_SYSTEM).not.toContain('EXTRA EXTRA')
    expect(CITAT_WRITE_SYSTEM).toContain('JSON-objekt')
  })
})
