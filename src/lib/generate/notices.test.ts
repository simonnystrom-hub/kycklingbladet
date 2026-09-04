import {describe, expect, it} from 'vitest'
import {validateGeneratedNotice, validateNoticePickIds} from './notices'

describe('validateNoticePickIds', () => {
  it('reads headlineIds from JSON', () => {
    expect(validateNoticePickIds({headlineIds: ['a', 'b']})).toEqual(['a', 'b'])
    expect(validateNoticePickIds({headlineIds: []})).toEqual([])
    expect(validateNoticePickIds({})).toBeNull()
  })
})

describe('validateGeneratedNotice', () => {
  it('requires headline and body', () => {
    expect(validateGeneratedNotice({headline: 'Luckan', body: 'Kacklet tystnade.'})).toEqual({
      headline: 'Luckan',
      body: 'Kacklet tystnade.',
    })
    expect(validateGeneratedNotice({headline: '', body: 'x'})).toBeNull()
    expect(validateGeneratedNotice({headline: 'x'})).toBeNull()
    expect(validateGeneratedNotice({headline: 'Luckan', body: 'Hon sa «nu».'})).toEqual({
      headline: 'Luckan',
      body: 'Hon sa "nu".',
    })
  })
})
