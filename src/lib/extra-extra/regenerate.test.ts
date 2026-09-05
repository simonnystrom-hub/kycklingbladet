import {describe, expect, it} from 'vitest'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import type {ExtraExtraPreview} from './payload'
import {briefFromPreview} from './regenerate'

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

describe('briefFromPreview', () => {
  it('returns null when preview has no valid image brief', () => {
    expect(briefFromPreview(flashPreview, undefined)).toBeNull()
  })

  it('returns null when image fields are empty strings', () => {
    expect(
      briefFromPreview(
        {
          ...flashPreview,
          imageShotType: '',
          imageCaption: '',
          imagePrompt: '',
        },
        undefined,
      ),
    ).toBeNull()
  })

  it('builds a brief from preview image fields', () => {
    expect(briefFromPreview(imagePreview, undefined)).toEqual({
      shotType: 'incident',
      caption: 'Tuppen Gösta vid luckan.',
      scenePrompt: 'A rooster by a hatch.',
    })
  })

  it('overrides shot type when a valid shotType is supplied', () => {
    expect(briefFromPreview(imagePreview, 'intervju')).toEqual({
      shotType: 'intervju',
      caption: 'Tuppen Gösta vid luckan.',
      scenePrompt: 'A rooster by a hatch.',
    })
  })

  it('keeps preview shot type when override is invalid', () => {
    expect(briefFromPreview(imagePreview, 'foto')).toEqual({
      shotType: 'incident',
      caption: 'Tuppen Gösta vid luckan.',
      scenePrompt: 'A rooster by a hatch.',
    })
  })
})
