import {describe, expect, it} from 'vitest'
import {IMAGE_BRIEF_SYSTEM, buildImageBriefUserPrompt} from './image-brief'

describe('image brief prompt', () => {
  it('forbids rewriting the article and asks for caption plus scene', () => {
    expect(IMAGE_BRIEF_SYSTEM).toContain('Skriv INTE om rubrik eller brödtext')
    expect(IMAGE_BRIEF_SYSTEM).toContain('imageCaption')
    expect(IMAGE_BRIEF_SYSTEM).toContain('imagePrompt')
  })

  it('includes the existing copy', () => {
    const prompt = buildImageBriefUserPrompt({
      kind: 'extra',
      headline: 'Putinsson slutar hugga',
      body: 'Hackandet tystnar.',
    })
    expect(prompt).toContain('EXTRA EXTRA')
    expect(prompt).toContain('Putinsson slutar hugga')
    expect(prompt).toContain('Hackandet tystnar.')
  })
})
