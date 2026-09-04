import {describe, expect, it} from 'vitest'
import {HEN_LEXICON, HEN_NAMES, HEN_HUMOR} from './hen-lexicon'
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
})
