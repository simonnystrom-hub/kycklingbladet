import {describe, expect, it} from 'vitest'
import {validateGeneratedXReply} from './parse'

describe('validateGeneratedXReply', () => {
  it('accepts a short hen reply', () => {
    expect(validateGeneratedXReply({text: '  Kacklet hörs över gården.  '})).toBe(
      'Kacklet hörs över gården.',
    )
  })

  it('rejects empty text, URLs and extra @mentions', () => {
    expect(validateGeneratedXReply({text: ''})).toBeNull()
    expect(validateGeneratedXReply({text: 'Se https://x.com/x'})).toBeNull()
    expect(validateGeneratedXReply({text: 'Hej @besokare i redet'})).toBeNull()
  })
})
