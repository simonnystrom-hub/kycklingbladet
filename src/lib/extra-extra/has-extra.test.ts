import {describe, expect, it} from 'vitest'
import type {ExtraExtra} from '@/lib/sanity/types'
import {hasExtraExtra} from './has-extra'

const extraExtra: ExtraExtra = {
  _id: 'extra-extra-2026-09-05',
  date: '2026-09-05',
  kicker: 'EXTRA EXTRA',
  headline: 'Tuppchock på riksväg 40',
  body: 'Hela gården håller andan.',
  sourceUrl: 'https://www.expressen.se/nyheter/test',
  sourceHeadline: 'Trafikstopp på riksväg 40',
  sourceNewspaper: 'Expressen',
  sourceNewspaperSlug: 'expressen',
  promptVersion: 'kb-extra-v1',
  modelVersion: 'claude-test',
  createdAt: '2026-09-05T09:00:00.000Z',
}

describe('hasExtraExtra', () => {
  it('accepts non-empty headline and body strings', () => {
    expect(hasExtraExtra(extraExtra)).toBe(true)
  })

  it.each([
    undefined,
    null,
    {...extraExtra, headline: ''},
    {...extraExtra, body: ''},
    {...extraExtra, headline: 42},
    {...extraExtra, body: 42},
  ])('rejects missing, empty, or non-string content', (value) => {
    expect(hasExtraExtra(value as ExtraExtra | null | undefined)).toBe(false)
  })
})
