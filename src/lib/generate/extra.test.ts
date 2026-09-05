import {describe, expect, it} from 'vitest'
import {validateGeneratedExtra} from './extra'

describe('validateGeneratedExtra', () => {
  it('requires headline and body', () => {
    expect(validateGeneratedExtra({headline: 'Luckan', body: 'Kacklet tystnade.'})).toEqual({
      headline: 'Luckan',
      body: 'Kacklet tystnade.',
    })
    expect(validateGeneratedExtra({headline: '', body: 'x'})).toBeNull()
    expect(validateGeneratedExtra({headline: 'Luckan', body: 'Hon sa «nu».'})).toEqual({
      headline: 'Luckan',
      body: 'Hon sa "nu".',
    })
  })
})
