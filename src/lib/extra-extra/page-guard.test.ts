import {describe, expect, it} from 'vitest'
import {canShowExtraExtraPage} from './page-guard'
import type {ExtraExtra} from '@/lib/sanity/types'

function extra(overrides: Partial<ExtraExtra> = {}): ExtraExtra {
  return {
    _id: 'extra-extra-2026-09-05',
    date: '2026-09-05',
    kicker: 'EXTRA EXTRA',
    headline: 'Räven gripen',
    body: 'Faran är över.',
    sourceUrl: 'https://example.com/extra',
    sourceHeadline: 'Räven gripen efter dramat',
    sourceNewspaper: 'Tidningen',
    sourceNewspaperSlug: 'tidningen',
    promptVersion: 'extra-v1',
    modelVersion: 'model-v1',
    createdAt: '2026-09-05T08:00:00.000Z',
    ...overrides,
  }
}

describe('canShowExtraExtraPage', () => {
  it('accepts an ISO date with a valid extra', () => {
    expect(canShowExtraExtraPage('2026-09-05', extra())).toBe(true)
  })

  it('rejects a bad date or a missing extra', () => {
    expect(canShowExtraExtraPage('nope', extra())).toBe(false)
    expect(canShowExtraExtraPage('2026-09-05', null)).toBe(false)
    expect(canShowExtraExtraPage('2026-09-05', extra({headline: ''}))).toBe(false)
  })
})
