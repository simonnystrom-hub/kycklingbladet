import {describe, expect, it} from 'vitest'
import {visdomsordShareOutcome} from './share-outcome'

describe('visdomsordShareOutcome', () => {
  it('marks used when either channel shared', () => {
    expect(visdomsordShareOutcome('shared', 'failed')).toEqual({markUsed: true, failed: true})
    expect(visdomsordShareOutcome('skipped', 'shared')).toEqual({markUsed: true, failed: false})
  })

  it('does not mark used when both skip', () => {
    expect(visdomsordShareOutcome('skipped', 'skipped')).toEqual({markUsed: false, failed: false})
  })
})
