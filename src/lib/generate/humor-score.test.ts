import {describe, expect, it} from 'vitest'
import {validateHumorScore} from './humor-score'

describe('validateHumorScore', () => {
  it('accepts an integer from 1 to 100', () => {
    expect(validateHumorScore({humorScore: 1})).toBe(1)
    expect(validateHumorScore({humorScore: 100})).toBe(100)
    expect(validateHumorScore({humorScore: '72'})).toBe(72)
  })

  it('rejects missing or out-of-range values', () => {
    expect(validateHumorScore({humorScore: 0})).toBeNull()
    expect(validateHumorScore({humorScore: 101})).toBeNull()
    expect(validateHumorScore({humorScore: 72.5})).toBeNull()
    expect(validateHumorScore({})).toBeNull()
    expect(validateHumorScore(null)).toBeNull()
  })
})
