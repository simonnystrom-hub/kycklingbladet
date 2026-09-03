import { describe, expect, it } from 'vitest'
import { selectWinner, type ScoredHeadline } from './select-winner'

function h(partial: Partial<ScoredHeadline> & Pick<ScoredHeadline, 'headlineId' | 'displayScore'>): ScoredHeadline {
  return {
    text: 'x',
    newspaperName: 'Expressen',
    newspaperSlug: 'expressen',
    ...partial,
  }
}

describe('selectWinner', () => {
  it('returns null for an empty list', () => {
    expect(selectWinner([])).toBeNull()
  })

  it('picks the highest displayScore', () => {
    const winner = selectWinner([
      h({ headlineId: 'a', displayScore: 40, newspaperSlug: 'dn' }),
      h({ headlineId: 'b', displayScore: 91, newspaperSlug: 'expressen', text: 'Snösmockan' }),
      h({ headlineId: 'c', displayScore: 70, newspaperSlug: 'aftonbladet' }),
    ])
    expect(winner?.headlineId).toBe('b')
    expect(winner?.text).toBe('Snösmockan')
  })

  it('breaks ties by newspaperSlug then headlineId', () => {
    const winner = selectWinner([
      h({ headlineId: 'z', displayScore: 80, newspaperSlug: 'svd' }),
      h({ headlineId: 'm', displayScore: 80, newspaperSlug: 'dn' }),
      h({ headlineId: 'a', displayScore: 80, newspaperSlug: 'dn' }),
    ])
    expect(winner?.headlineId).toBe('a')
  })
})
