import {describe, expect, it} from 'vitest'
import {
  HEN_HUMOR,
  HEN_LEXICON,
  HEN_LEXICON_EN,
  HEN_NAMES,
  henLexiconForLanguage,
  henNamesForLanguage,
} from './hen-lexicon'
import {NOTICE_WRITE_SYSTEM} from './notice-prompt'
import {SYSTEM_PROMPT} from './prompt'

describe('shared hen lexicon', () => {
  it('is used by both the lead and the notice', () => {
    expect(SYSTEM_PROMPT).toContain(HEN_LEXICON)
    expect(SYSTEM_PROMPT).toContain(HEN_NAMES)
    expect(SYSTEM_PROMPT).toContain(HEN_HUMOR)
    expect(NOTICE_WRITE_SYSTEM).toContain(HEN_LEXICON)
    expect(NOTICE_WRITE_SYSTEM).toContain(HEN_NAMES)
    expect(NOTICE_WRITE_SYSTEM).toContain(HEN_HUMOR)
  })

  it('keeps Extra Extra and notices on the Swedish lexicon', () => {
    expect(SYSTEM_PROMPT).not.toContain(HEN_LEXICON_EN)
    expect(NOTICE_WRITE_SYSTEM).not.toContain(HEN_LEXICON_EN)
  })

  it('selects an English hen lexicon for English X copy', () => {
    expect(henLexiconForLanguage('en')).toContain('woman = hen')
    expect(henLexiconForLanguage('en')).toContain('man = rooster')
    expect(henLexiconForLanguage('en')).toContain('criminal = fox')
    expect(henLexiconForLanguage('en')).toContain('roll-coop')
    expect(henLexiconForLanguage('sv')).toBe(HEN_LEXICON)
    expect(henNamesForLanguage('en')).toContain('Rooster Trump')
    expect(henNamesForLanguage('sv')).toBe(HEN_NAMES)
  })
})
