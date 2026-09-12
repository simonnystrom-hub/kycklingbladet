import {describe, expect, it} from 'vitest'
import {
  buildCitatUserPrompt,
  citatKnobsFromPayload,
  citatSpeechBubbleSystem,
  citatWriteSystem,
  CITAT_SPEECH_BUBBLE_SYSTEM,
  CITAT_WRITE_SYSTEM,
} from './prompt'
import {HEN_LEXICON, HEN_LEXICON_EN} from '@/lib/generate/hen-lexicon'

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
    expect(CITAT_WRITE_SYSTEM).toContain('raka citattecken')
    expect(CITAT_WRITE_SYSTEM).toContain(HEN_LEXICON)
    expect(CITAT_WRITE_SYSTEM).toContain('Skriv citat-tweeten på svenska')
    expect(CITAT_WRITE_SYSTEM).toContain('hashtags')
    expect(CITAT_WRITE_SYSTEM).toContain('forsvar')
  })

  it('switches to English hen copy when language is en', () => {
    const system = citatWriteSystem('en')
    expect(system).toContain(HEN_LEXICON_EN)
    expect(system).not.toContain(HEN_LEXICON)
    expect(system).toContain('Write the hen tweet in English')
    expect(system).toContain('English picture caption')
  })
})

describe('CITAT_SPEECH_BUBBLE_SYSTEM', () => {
  it('asks for a short JSON balloon line', () => {
    expect(CITAT_SPEECH_BUBBLE_SYSTEM).toContain('pratbubbla')
    expect(CITAT_SPEECH_BUBBLE_SYSTEM).toContain('JSON')
    expect(CITAT_SPEECH_BUBBLE_SYSTEM).toContain('svensk')
  })

  it('asks for an English balloon when language is en', () => {
    expect(citatSpeechBubbleSystem('en')).toContain('Funny, short, English')
    expect(citatSpeechBubbleSystem('en')).toContain(HEN_LEXICON_EN)
  })
})
