import { describe, expect, it } from 'vitest'
import { selectWinner, type ScoredHeadline } from './select-winner'

function h(
  partial: Partial<ScoredHeadline> & Pick<ScoredHeadline, 'headlineId' | 'displayScore'>,
): ScoredHeadline {
  return {
    text: 'x',
    newspaperName: 'Expressen',
    newspaperSlug: 'expressen',
    newspaperDailyScore: 50,
    ...partial,
  }
}

describe('selectWinner', () => {
  it('returns null for an empty list', () => {
    expect(selectWinner([])).toBeNull()
  })

  it('only considers headlines from the newspaper with the highest daily index', () => {
    const winner = selectWinner([
      h({
        headlineId: 'hot',
        displayScore: 91,
        newspaperSlug: 'aftonbladet',
        newspaperDailyScore: 40,
        text: 'Inte vinnaren',
      }),
      h({
        headlineId: 'index',
        displayScore: 55,
        newspaperSlug: 'expressen',
        newspaperDailyScore: 88,
        text: 'Dagens löpsedel',
      }),
    ])
    expect(winner?.headlineId).toBe('index')
    expect(winner?.text).toBe('Dagens löpsedel')
  })

  it('picks the highest displayScore among the winning newspaper', () => {
    const winner = selectWinner([
      h({ headlineId: 'a', displayScore: 40, newspaperSlug: 'expressen', newspaperDailyScore: 80 }),
      h({
        headlineId: 'b',
        displayScore: 91,
        newspaperSlug: 'expressen',
        newspaperDailyScore: 80,
        text: 'Snösmockan',
      }),
      h({ headlineId: 'c', displayScore: 70, newspaperSlug: 'aftonbladet', newspaperDailyScore: 60 }),
    ])
    expect(winner?.headlineId).toBe('b')
    expect(winner?.text).toBe('Snösmockan')
  })

  it('breaks ties by newspaperSlug then headlineId', () => {
    const winner = selectWinner([
      h({ headlineId: 'z', displayScore: 80, newspaperSlug: 'svd', newspaperDailyScore: 70 }),
      h({ headlineId: 'm', displayScore: 80, newspaperSlug: 'dn', newspaperDailyScore: 70 }),
      h({ headlineId: 'a', displayScore: 80, newspaperSlug: 'dn', newspaperDailyScore: 70 }),
    ])
    expect(winner?.headlineId).toBe('a')
  })
})
