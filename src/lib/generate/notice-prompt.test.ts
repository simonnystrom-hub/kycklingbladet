import {describe, expect, it} from 'vitest'
import {NOTICE_PICK_SYSTEM, NOTICE_WRITE_SYSTEM} from './notice-prompt'

describe('notice prompts', () => {
  it('picks for hen-house fit, not panic rank', () => {
    expect(NOTICE_PICK_SYSTEM).toContain('Inte högst panikpoäng')
    expect(NOTICE_PICK_SYSTEM).toContain('hönshus')
    expect(NOTICE_PICK_SYSTEM).toContain('Skratta inte åt olyckan')
    expect(NOTICE_PICK_SYSTEM).toContain('headlineIds')
  })

  it('writes a short notice with the hen-house lexicon and no expert box', () => {
    expect(NOTICE_WRITE_SYSTEM).toContain('barn = kyckling')
    expect(NOTICE_WRITE_SYSTEM).toContain('Ingen expertruta')
    expect(NOTICE_WRITE_SYSTEM).toContain('Kalla det inte satir')
  })
})
