import {describe, expect, it} from 'vitest'
import {X_REPLY_WRITE_SYSTEM, buildXReplyUserPrompt, xReplyWriteSystem} from './prompt'
import {HEN_LEXICON, HEN_LEXICON_EN} from '@/lib/generate/hen-lexicon'

describe('buildXReplyUserPrompt', () => {
  it('includes the source handle, tweet and knobs', () => {
    const prompt = buildXReplyUserPrompt({
      text: 'Era hönor ljuger',
      username: 'besokare',
      dumhet: 4,
      uppskruvning: 1,
    })
    expect(prompt).toContain('@besokare')
    expect(prompt).toContain('Era hönor ljuger')
    expect(prompt).toContain('Dumhet 4/5')
    expect(prompt).toContain('Uppskruvning 1/5')
  })
})

describe('X_REPLY_WRITE_SYSTEM', () => {
  it('forbids urls mentions hashtags and extra extra', () => {
    expect(X_REPLY_WRITE_SYSTEM).toContain('JSON')
    expect(X_REPLY_WRITE_SYSTEM.toLowerCase()).toContain('url')
    expect(X_REPLY_WRITE_SYSTEM).toContain('se länk')
    expect(X_REPLY_WRITE_SYSTEM).toContain('@')
    expect(X_REPLY_WRITE_SYSTEM).toContain(HEN_LEXICON)
    expect(X_REPLY_WRITE_SYSTEM).toContain('Skriv svaret på svenska')
  })

  it('switches to English hen copy when language is en', () => {
    const system = xReplyWriteSystem('en')
    expect(system).toContain(HEN_LEXICON_EN)
    expect(system).not.toContain(HEN_LEXICON)
    expect(system).toContain('Write the hen reply in English')
  })
})
