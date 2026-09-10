import {describe, expect, it} from 'vitest'
import {validateGeneratedXReply} from './parse'

describe('validateGeneratedXReply', () => {
  it('accepts a short hen reply', () => {
    expect(validateGeneratedXReply({text: '  Kacklet hörs över gården.  '})).toBe(
      'Kacklet hörs över gården.',
    )
  })

  it('rejects empty text, URLs, extra @mentions, hashtags, and emoji', () => {
    expect(validateGeneratedXReply({text: ''})).toBeNull()
    expect(validateGeneratedXReply({text: 'Se https://x.com/x'})).toBeNull()
    expect(validateGeneratedXReply({text: 'Hej @besokare i redet'})).toBeNull()
    expect(validateGeneratedXReply({text: '#gården'})).toBeNull()
    expect(validateGeneratedXReply({text: 'Bra 🐔'})).toBeNull()
  })
})
