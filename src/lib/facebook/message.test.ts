import {describe, expect, it} from 'vitest'
import {
  FACEBOOK_LINK_HINT,
  facebookExtraMessage,
  facebookLeadMessage,
} from './message'

const lead = {
  headline: 'Tvingades söka skydd i grannredet',
  body: 'Första stycket.\n\nAndra stycket.',
  expertVoice: 'Högsta hönset',
  expertHeadline: 'Så fungerar nödredet',
  expertText: 'Skyddet innebär trygghet.',
}

describe('facebookLeadMessage', () => {
  it('includes headline, caption, body, expert, notices, and the comment hint', () => {
    const text = facebookLeadMessage({
      ...lead,
      imageCaption: 'Hönan vid luckan.',
      notices: [
        {headline: 'Glitterboll', body: 'Tuppen skadad.'},
        {headline: 'Celina', body: 'Trådrulle mot räven.'},
      ],
    })

    expect(text).toBe(
      [
        'Tvingades söka skydd i grannredet',
        'Hönan vid luckan.',
        'Första stycket.\n\nAndra stycket.',
        'Högsta hönset Så fungerar nödredet',
        'Skyddet innebär trygghet.',
        'Notiser',
        'Glitterboll',
        'Tuppen skadad.',
        'Celina',
        'Trådrulle mot räven.',
        FACEBOOK_LINK_HINT,
      ].join('\n\n'),
    )
  })

  it('omits caption and Notiser when they are missing', () => {
    const text = facebookLeadMessage({...lead, imageCaption: '  ', notices: []})
    expect(text).not.toContain('Notiser')
    expect(text).not.toContain('Hönan vid luckan')
    expect(text.endsWith(FACEBOOK_LINK_HINT)).toBe(true)
  })
})

describe('facebookExtraMessage', () => {
  it('stamps EXTRA EXTRA and skips expert and notices', () => {
    const text = facebookExtraMessage({
      headline: 'Putinsson slutar hugga',
      body: 'Hackandet tystnar.',
      imageCaption: 'Taleshönan vid tråget.',
    })

    expect(text).toBe(
      [
        'EXTRA EXTRA',
        'Putinsson slutar hugga',
        'Taleshönan vid tråget.',
        'Hackandet tystnar.',
        FACEBOOK_LINK_HINT,
      ].join('\n\n'),
    )
    expect(text).not.toContain('Notiser')
    expect(text).not.toContain('Högsta hönset')
  })
})
