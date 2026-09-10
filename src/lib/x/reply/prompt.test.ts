import {describe, expect, it} from 'vitest'
import {X_REPLY_WRITE_SYSTEM, buildXReplyUserPrompt} from './prompt'

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
    expect(X_REPLY_WRITE_SYSTEM).toContain('@')
  })
})
