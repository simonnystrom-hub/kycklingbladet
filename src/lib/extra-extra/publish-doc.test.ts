import {describe, expect, it} from 'vitest'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import type {ExtraExtraPreview} from './payload'
import {extraCreateDocument} from './publish-doc'

const flashPreview: ExtraExtraPreview = {
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

const imagePreview: ExtraExtraPreview = {
  ...flashPreview,
  imageShotType: 'incident',
  imageCaption: 'Tuppen Gösta vid luckan.',
  imagePrompt: 'A rooster by a hatch.',
}

describe('extraCreateDocument', () => {
  it('omits image fields when no asset is provided', () => {
    const doc = extraCreateDocument({
      id: 'extra-extra-2026-09-05',
      date: '2026-09-05',
      preview: flashPreview,
      asset: null,
      createdAt: '2026-09-05T12:00:00.000Z',
    })

    expect(doc).not.toHaveProperty('image')
    expect(doc).not.toHaveProperty('imageCaption')
    expect(doc).not.toHaveProperty('imageShotType')
    expect(doc).not.toHaveProperty('imagePrompt')
    expect(doc).toMatchObject({
      _id: 'extra-extra-2026-09-05',
      _type: 'extraExtra',
      date: '2026-09-05',
      kicker: EXTRA_KICKER,
      headline: flashPreview.headline,
      body: flashPreview.body,
      createdAt: '2026-09-05T12:00:00.000Z',
    })
  })

  it('includes image ref and caption when asset and brief fields are present', () => {
    const doc = extraCreateDocument({
      id: 'extra-extra-2026-09-05',
      date: '2026-09-05',
      preview: imagePreview,
      asset: {_id: 'image-abc123'},
      createdAt: '2026-09-05T12:00:00.000Z',
    })

    expect(doc).toMatchObject({
      image: {
        _type: 'image',
        asset: {_type: 'reference', _ref: 'image-abc123'},
      },
      imageCaption: 'Tuppen Gösta vid luckan.',
      imageShotType: 'incident',
      imagePrompt: 'A rooster by a hatch.',
    })
  })
})
