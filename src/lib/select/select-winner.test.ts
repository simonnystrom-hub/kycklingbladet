import { describe, expect, it } from 'vitest'
import {
  recentLeadWindow,
  selectWinner,
  type ScoredHeadline,
  type UsedLeadSource,
} from './select-winner'

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

describe('recentLeadWindow', () => {
  it('covers the seven days before the issue date', () => {
    expect(recentLeadWindow('2026-09-05')).toEqual({
      start: '2026-08-29',
      before: '2026-09-05',
    })
  })
})

describe('selectWinner', () => {
  it('returns null for an empty list', () => {
    expect(selectWinner([])).toBeNull()
  })

  it('picks the highest displayScore regardless of newspaper daily index', () => {
    const winner = selectWinner([
      h({
        headlineId: 'hot',
        displayScore: 91,
        newspaperSlug: 'aftonbladet',
        newspaperDailyScore: 40,
        text: 'Heta löpsedeln',
      }),
      h({
        headlineId: 'index',
        displayScore: 55,
        newspaperSlug: 'expressen',
        newspaperDailyScore: 88,
        text: 'Dagens löpsedel',
      }),
    ])
    expect(winner?.headlineId).toBe('hot')
    expect(winner?.text).toBe('Heta löpsedeln')
  })

  it('picks the highest displayScore among all newspapers', () => {
    const winner = selectWinner([
      h({headlineId: 'a', displayScore: 40, newspaperSlug: 'expressen', newspaperDailyScore: 80}),
      h({
        headlineId: 'b',
        displayScore: 91,
        newspaperSlug: 'expressen',
        newspaperDailyScore: 80,
        text: 'Snösmockan',
      }),
      h({headlineId: 'c', displayScore: 70, newspaperSlug: 'aftonbladet', newspaperDailyScore: 60}),
    ])
    expect(winner?.headlineId).toBe('b')
    expect(winner?.text).toBe('Snösmockan')
  })

  it('breaks ties by newspaperSlug then headlineId', () => {
    const winner = selectWinner([
      h({headlineId: 'z', displayScore: 80, newspaperSlug: 'svd', newspaperDailyScore: 70}),
      h({headlineId: 'm', displayScore: 80, newspaperSlug: 'dn', newspaperDailyScore: 70}),
      h({headlineId: 'a', displayScore: 80, newspaperSlug: 'dn', newspaperDailyScore: 70}),
    ])
    expect(winner?.headlineId).toBe('a')
  })

  it('skips a used source headline id and takes the next best', () => {
    const used: UsedLeadSource[] = [{sourceHeadline: 'old', sourceNewspaperSlug: 'aftonbladet', sourceHeadlineId: 'hot'}]
    const winner = selectWinner(
      [
        h({headlineId: 'hot', displayScore: 91, newspaperSlug: 'aftonbladet', text: 'Heta'}),
        h({headlineId: 'two', displayScore: 80, newspaperSlug: 'expressen', text: 'Tvåan'}),
        h({headlineId: 'three', displayScore: 70, newspaperSlug: 'dn', text: 'Trean'}),
      ],
      used,
    )
    expect(winner?.headlineId).toBe('two')
  })

  it('skips a used source by newspaper and exact text', () => {
    const used: UsedLeadSource[] = [{sourceHeadline: 'Heta', sourceNewspaperSlug: 'aftonbladet'}]
    const winner = selectWinner(
      [
        h({headlineId: 'hot', displayScore: 91, newspaperSlug: 'aftonbladet', text: 'Heta'}),
        h({headlineId: 'two', displayScore: 80, newspaperSlug: 'expressen', text: 'Tvåan'}),
      ],
      used,
    )
    expect(winner?.headlineId).toBe('two')
  })

  it('walks down the ranking until an unused headline remains', () => {
    const used: UsedLeadSource[] = [
      {sourceHeadline: 'a', sourceNewspaperSlug: 'aftonbladet', sourceHeadlineId: 'hot'},
      {sourceHeadline: 'b', sourceNewspaperSlug: 'expressen', sourceHeadlineId: 'two'},
    ]
    const winner = selectWinner(
      [
        h({headlineId: 'hot', displayScore: 91, newspaperSlug: 'aftonbladet'}),
        h({headlineId: 'two', displayScore: 80, newspaperSlug: 'expressen'}),
        h({headlineId: 'three', displayScore: 70, newspaperSlug: 'dn', text: 'Trean'}),
      ],
      used,
    )
    expect(winner?.headlineId).toBe('three')
  })

  it('returns null when every headline was already a lead', () => {
    const used: UsedLeadSource[] = [
      {sourceHeadline: 'x', sourceNewspaperSlug: 'aftonbladet', sourceHeadlineId: 'hot'},
    ]
    expect(
      selectWinner(
        [h({headlineId: 'hot', displayScore: 91, newspaperSlug: 'aftonbladet'})],
        used,
      ),
    ).toBeNull()
  })
})
