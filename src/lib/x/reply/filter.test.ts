import {describe, expect, it} from 'vitest'
import {
  maxSnowflake,
  mentionSkipReason,
  sourceTweetUrl,
  type XMention,
} from './filter'

const base: XMention = {
  id: '10',
  text: 'Hej @Kycklingbladet',
  authorId: 'u2',
  authorUsername: 'besokare',
  inReplyToStatusId: null,
}

const ctx = {
  ourUserId: 'u1',
  existingSourceIds: new Set(['9']),
  ourPostedIds: new Set(['posted-1']),
}

describe('mentionSkipReason', () => {
  it('skips our own account by id or handle', () => {
    expect(mentionSkipReason({...base, authorId: 'u1'}, ctx)).toBe('self')
    expect(mentionSkipReason({...base, authorUsername: 'kycklingbladet'}, ctx)).toBe('self')
  })

  it('skips empty text, duplicates, and replies to our replies', () => {
    expect(mentionSkipReason({...base, text: '  '}, ctx)).toBe('empty')
    expect(mentionSkipReason({...base, id: '9'}, ctx)).toBe('duplicate')
    expect(mentionSkipReason({...base, inReplyToStatusId: 'posted-1'}, ctx)).toBe('loop')
  })

  it('allows a fresh mention', () => {
    expect(mentionSkipReason(base, ctx)).toBeNull()
  })
})

describe('sourceTweetUrl / maxSnowflake', () => {
  it('builds the public status URL and picks the highest id', () => {
    expect(sourceTweetUrl('Besokare', '10')).toBe('https://x.com/Besokare/status/10')
    expect(maxSnowflake(['9', '11', '10'])).toBe('11')
    expect(maxSnowflake([])).toBeNull()
  })
})
