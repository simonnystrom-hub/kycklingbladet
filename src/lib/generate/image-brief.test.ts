import {describe, expect, it} from 'vitest'
import {IMAGE_BRIEF_SYSTEM, buildImageBriefUserPrompt} from './image-brief'

describe('image brief prompt', () => {
  it('forbids rewriting the article and asks for caption plus scene', () => {
    expect(IMAGE_BRIEF_SYSTEM).toContain('Skriv INTE om rubrik eller brödtext')
    expect(IMAGE_BRIEF_SYSTEM).toContain('imageCaption')
    expect(IMAGE_BRIEF_SYSTEM).toContain('imagePrompt')
    expect(IMAGE_BRIEF_SYSTEM).toMatch(/Teckningen är tyst/)
    expect(IMAGE_BRIEF_SYSTEM).toMatch(/Citera ALDRIG visdomen/)
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

  it('labels visdomsord copy and includes the quote', () => {
    const prompt = buildImageBriefUserPrompt({
      kind: 'visdomsord',
      headline: 'Gerda',
      body: 'Sitt inte',
    })
    expect(prompt).toMatch(/VISDOMSORD/i)
    expect(prompt).toContain('Sitt inte')
    expect(prompt).toMatch(/Teckna innebörden tyst/i)
    expect(prompt).toContain('Kycklingbladet.com')
  })
})
