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
    expect(EXTRA_WRITE_SYSTEM).toContain('citat eller andra ord i scenen')
  })
})

describe('buildExtraWriteUserPrompt', () => {
  it('includes newspaper and source headline', () => {
    expect(buildExtraWriteUserPrompt({text: 'Får inte heta sylt', newspaperName: 'Sydsvenskan'})).toBe(
      `Tidning: Sydsvenskan
Rubrik: "Får inte heta sylt"`,
    )
  })
})
