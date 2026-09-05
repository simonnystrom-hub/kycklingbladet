import {describe, expect, it} from 'vitest'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import type {ExtraDrawResult} from './draw'
import type {ExtraExtraPreview} from './payload'
import {extraPreviewResponse} from './preview-body'

const preview: ExtraExtraPreview = {
  kicker: EXTRA_KICKER,
  headline: 'Tuppchock på riksväg 40',
  body: 'Hela gården håller andan.',
  sourceUrl: 'https://www.expressen.se/nyheter/test',
  sourceHeadline: 'Trafikstopp på riksväg 40',
  sourceNewspaper: 'Expressen',
  sourceNewspaperSlug: 'expressen',
  promptVersion: 'kb-extra-v1',
  modelVersion: 'claude-test',
  imageShotType: 'incident',
  imageCaption: 'Tuppen Gösta vid luckan.',
  imagePrompt: 'A rooster by a hatch.',
}

describe('extraPreviewResponse', () => {
  it('combines preview with draw result', () => {
    const draw: ExtraDrawResult = {
      image: {mimeType: 'image/jpeg', base64: 'abc123'},
      imageError: null,
    }
    expect(extraPreviewResponse(preview, draw)).toEqual({
      preview,
      image: draw.image,
      imageError: draw.imageError,
    })
  })

  it('passes through null image and imageError', () => {
    const draw: ExtraDrawResult = {image: null, imageError: 'Kunde inte rita bilden'}
    expect(extraPreviewResponse(preview, draw)).toEqual({
      preview,
      image: null,
      imageError: 'Kunde inte rita bilden',
    })
  })
})
