import {describe, expect, it} from 'vitest'
import type {ExtraExtra} from '@/lib/sanity/types'
import {extraIllustration} from './illustration'

const base: ExtraExtra = {
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

describe('extraIllustration', () => {
  it('requires url and caption', () => {
    expect(
      extraIllustration({
        ...base,
        imageUrl: 'https://cdn.sanity.io/x.jpg',
        imageCaption: 'Tuppen Gösta.',
      }),
    ).toEqual({
      url: 'https://cdn.sanity.io/x.jpg',
      caption: 'Tuppen Gösta.',
    })
    expect(extraIllustration({...base, imageUrl: '', imageCaption: 'x'})).toBeNull()
    expect(extraIllustration(base)).toBeNull()
  })
})
