import {describe, expect, it} from 'vitest'
import {EXTRA_WRITE_SYSTEM, EXTRA_PROMPT_VERSION, buildExtraWriteUserPrompt} from './extra-prompt'
import {HEN_LEXICON, HEN_HUMOR} from './hen-lexicon'

describe('EXTRA_WRITE_SYSTEM', () => {
  it('is a flash: EXTRA EXTRA stamp, shared lexicon, no expert box', () => {
    expect(EXTRA_PROMPT_VERSION).toBe('kb-extra-v2')
    expect(EXTRA_WRITE_SYSTEM).toContain(HEN_LEXICON)
    expect(EXTRA_WRITE_SYSTEM).toContain(HEN_HUMOR)
    expect(EXTRA_WRITE_SYSTEM).toContain('EXTRA EXTRA')
    expect(EXTRA_WRITE_SYSTEM).toContain('två till tre korta stycken')
    expect(EXTRA_WRITE_SYSTEM).toContain('Ingen expertruta')
    expect(EXTRA_WRITE_SYSTEM).toContain('Byt ut saken, inte bara människorna')
    expect(EXTRA_WRITE_SYSTEM).not.toContain('Överhönan — analys')
    expect(EXTRA_WRITE_SYSTEM).toContain('imageShotType')
    expect(EXTRA_WRITE_SYSTEM).toContain('imageCaption')
    expect(EXTRA_WRITE_SYSTEM).toContain('intervju')
    expect(EXTRA_WRITE_SYSTEM).toContain('Bildtexten ska aldrig in i teckningen')
    expect(EXTRA_WRITE_SYSTEM).toContain('Följ användarens Dumhet- och Uppskruvning-skalor')
    expect(EXTRA_WRITE_SYSTEM).toContain('citat eller andra ord i scenen')
  })
})

describe('buildExtraWriteUserPrompt', () => {
  it('includes newspaper, source headline, and default knobs', () => {
    expect(buildExtraWriteUserPrompt({text: 'Får inte heta sylt', newspaperName: 'Sydsvenskan'}))
      .toContain('Tidning: Sydsvenskan')
    expect(buildExtraWriteUserPrompt({text: 'Får inte heta sylt', newspaperName: 'Sydsvenskan'}))
      .toContain('Rubrik: "Får inte heta sylt"')
    expect(buildExtraWriteUserPrompt({text: 'Får inte heta sylt', newspaperName: 'Sydsvenskan'}))
      .toContain('Dumhet 3/5')
    expect(buildExtraWriteUserPrompt({text: 'Får inte heta sylt', newspaperName: 'Sydsvenskan'}))
      .toContain('Uppskruvning 3/5')
  })

  it('clamps knobs to 1–5 and uses the matching hints', () => {
    const text = buildExtraWriteUserPrompt({
      text: 'Får inte heta sylt',
      newspaperName: 'Sydsvenskan',
      dumhet: 5,
      uppskruvning: 1,
    })
    expect(text).toContain('Dumhet 5/5')
    expect(text).toContain('Maximal dumhet')
    expect(text).toContain('Uppskruvning 1/5')
    expect(text).toContain('Lugn rubrik')
  })

  it('falls back to 3 when knobs are missing or invalid', () => {
    const text = buildExtraWriteUserPrompt({
      text: 'Får inte heta sylt',
      newspaperName: 'Sydsvenskan',
      dumhet: 9,
      uppskruvning: 0,
    })
    expect(text).toContain('Dumhet 3/5')
    expect(text).toContain('Uppskruvning 3/5')
  })
})
