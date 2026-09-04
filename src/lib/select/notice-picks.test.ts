import {describe, expect, it} from 'vitest'
import type {ScoredHeadline} from './select-winner'
import {remainingHeadlines, sanitizePickedIds} from './notice-picks'

const lead: ScoredHeadline = {
  headlineId: 'h-lead',
  text: '900 fast',
  newspaperName: 'Expressen',
  newspaperSlug: 'expressen',
  displayScore: 80,
  newspaperDailyScore: 90,
}

const other: ScoredHeadline = {
  headlineId: 'h-2',
  text: 'Gyro',
  newspaperName: 'Aftonbladet',
  newspaperSlug: 'aftonbladet',
  displayScore: 40,
  newspaperDailyScore: 50,
}

const third: ScoredHeadline = {
  headlineId: 'h-3',
  text: 'Pinnen',
  newspaperName: 'DN',
  newspaperSlug: 'dn',
  displayScore: 30,
  newspaperDailyScore: 40,
}

describe('remainingHeadlines', () => {
  it('drops the lead by id or by slug plus original text', () => {
    expect(remainingHeadlines([lead, other], {sourceHeadline: '900 fast', sourceNewspaperSlug: 'expressen'}).map((h) => h.headlineId)).toEqual(['h-2'])
    expect(
      remainingHeadlines([lead, other], {
        sourceHeadline: 'other',
        sourceNewspaperSlug: 'x',
        sourceHeadlineId: 'h-lead',
      }).map((h) => h.headlineId),
    ).toEqual(['h-2'])
  })
})

describe('remainingHeadlines with existing notices', () => {
  it('drops already used sources so a second fill can add one more', () => {
    expect(
      remainingHeadlines([lead, other, third], {sourceHeadline: '900 fast', sourceNewspaperSlug: 'expressen'}, [
        {sourceHeadline: 'Gyro', sourceNewspaperSlug: 'aftonbladet', sourceHeadlineId: 'h-2'},
      ]).map((h) => h.headlineId),
    ).toEqual(['h-3'])
  })
})

describe('sanitizePickedIds', () => {
  it('keeps at most two unique ids that exist in the pool', () => {
    expect(sanitizePickedIds(['h-2', 'h-2', 'h-lead', 'h-3', 'nope'], [other, third])).toEqual([
      'h-2',
      'h-3',
    ])
  })

  it('returns one or zero when the pool is shorter', () => {
    expect(sanitizePickedIds(['h-2', 'h-3'], [other])).toEqual(['h-2'])
    expect(sanitizePickedIds(['nope'], [])).toEqual([])
  })
})
