import {describe, expect, it} from 'vitest'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import {parseExtraPreview} from './payload'

const validPreview = {
  kicker: EXTRA_KICKER,
  headline: 'Tuppchock på riksväg 40',
  body: 'Hela gården håller andan.',
  sourceUrl: 'https://www.expressen.se/nyheter/test',
  sourceHeadline: 'Trafikstopp på riksväg 40',
  sourceNewspaper: 'Expressen',
  sourceNewspaperSlug: 'expressen',
  promptVersion: 'kb-extra-v1',
  modelVersion: 'claude-test',
}

describe('parseExtraPreview', () => {
  it('returns a valid preview', () => {
    expect(parseExtraPreview(validPreview)).toEqual(validPreview)
  })

  it.each(Object.keys(validPreview))('requires string field %s', (field) => {
    const missing = {...validPreview}
    delete missing[field as keyof typeof missing]
    expect(parseExtraPreview(missing)).toBeNull()

    expect(parseExtraPreview({...validPreview, [field]: 123})).toBeNull()
  })

  it('requires the EXTRA EXTRA kicker', () => {
    expect(parseExtraPreview({...validPreview, kicker: 'EXTRA'})).toBeNull()
  })

  it('requires an HTTPS source URL', () => {
    expect(parseExtraPreview({...validPreview, sourceUrl: 'http://expressen.se/test'})).toBeNull()
    expect(parseExtraPreview({...validPreview, sourceUrl: 'not a URL'})).toBeNull()
  })

  it.each([null, undefined, [], 'preview', 42])('rejects non-object input %#', (input) => {
    expect(parseExtraPreview(input)).toBeNull()
  })
})
