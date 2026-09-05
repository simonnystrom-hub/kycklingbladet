import {describe, expect, it} from 'vitest'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import {parseExtraPreview, parseExtraPreviewImage} from './payload'

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

  it('round-trips valid optional image fields', () => {
    const withImage = {
      ...validPreview,
      imageShotType: 'incident',
      imageCaption: 'Tuppen Gösta vid luckan i går kväll.',
      imagePrompt: 'A rooster by a henhouse hatch at night, simple panel.',
    }
    expect(parseExtraPreview(withImage)).toEqual(withImage)
  })

  it('parses flash-only preview without image fields', () => {
    expect(parseExtraPreview(validPreview)).toEqual(validPreview)
  })

  it('treats empty image strings as absent', () => {
    expect(
      parseExtraPreview({
        ...validPreview,
        imageShotType: '',
        imageCaption: '',
        imagePrompt: '',
      }),
    ).toEqual(validPreview)
  })

  it('rejects preview when image fields are present but invalid', () => {
    expect(
      parseExtraPreview({
        ...validPreview,
        imageShotType: 'foto',
        imageCaption: 'Caption.',
        imagePrompt: 'Scene.',
      }),
    ).toBeNull()
  })
})

describe('parseExtraPreviewImage', () => {
  it('accepts a jpeg payload with non-empty base64', () => {
    expect(parseExtraPreviewImage({mimeType: 'image/jpeg', base64: 'abc123'})).toEqual({
      mimeType: 'image/jpeg',
      base64: 'abc123',
    })
  })

  it('rejects non-jpeg mime types', () => {
    expect(parseExtraPreviewImage({mimeType: 'image/png', base64: 'abc123'})).toBeNull()
  })

  it('rejects empty base64', () => {
    expect(parseExtraPreviewImage({mimeType: 'image/jpeg', base64: ''})).toBeNull()
  })
})
