import {describe, expect, it} from 'vitest'
import {facebookExpertBlock, facebookExtraMessage, facebookLeadMessage} from './message'
import {facebookBold, facebookBoldCaps, facebookItalic} from './style-text'

const lead = {
  headline: 'Tvingades söka skydd i grannredet',
  body: 'Första stycket.\n\nAndra stycket.',
  expertVoice: 'Högsta hönset',
  expertHeadline: 'Så fungerar nödredet',
  expertText: 'Skyddet innebär trygghet.',
}

describe('facebookLeadMessage', () => {
  it('uses a bold-caps title, body, expert quote, then italic caption line', () => {
    const text = facebookLeadMessage({
      ...lead,
      imageCaption: 'Hönan vid luckan.',
      notices: [{headline: 'Glitterboll', body: 'Tuppen skadad.'}],
    })

    expect(text).toBe(
      [
        facebookBoldCaps('Tvingades söka skydd i grannredet'),
        'Första stycket.\n\nAndra stycket.',
        `${facebookBold('Högsta hönset')}: "Skyddet innebär trygghet."`,
        facebookItalic('I bilden: Hönan vid luckan.'),
      ].join('\n\n'),
    )
    expect(text).not.toContain('Notiser')
    expect(text).not.toContain('Se länk i kommentar')
  })

  it('omits the caption and expert lines when they are missing', () => {
    const text = facebookLeadMessage({
      headline: lead.headline,
      body: lead.body,
      expertVoice: '  ',
      expertText: '',
      imageCaption: '  ',
      notices: [],
    })
    expect(text).not.toContain('I bilden:')
    expect(text).not.toContain(facebookBold('Högsta hönset'))
    expect(text).toBe(
      [facebookBoldCaps('Tvingades söka skydd i grannredet'), 'Första stycket.\n\nAndra stycket.'].join(
        '\n\n',
      ),
    )
  })
})

describe('facebookExpertBlock', () => {
  it('keeps existing wrapping quotes', () => {
    expect(
      facebookExpertBlock({
        expertVoice: 'Överhönan',
        expertText: '"Sitt inte med ryggen mot luckan."',
      }),
    ).toBe(`${facebookBold('Överhönan')}: "Sitt inte med ryggen mot luckan."`)
  })
})

describe('facebookExtraMessage', () => {
  it('omits the EXTRA EXTRA stamp and strips a leading stamp from the body', () => {
    const text = facebookExtraMessage({
      headline: 'Putinsson slutar hugga',
      body: 'EXTRA EXTRA Efter månader av rävanfall tystnar hackandet.',
      imageCaption: 'Taleshönan vid tråget.',
      expertVoice: 'Gårdsanalytikern',
      expertText: 'Hackandet tystnar bara tills nästa natt.',
    })

    expect(text).toBe(
      [
        facebookBoldCaps('Putinsson slutar hugga'),
        'Efter månader av rävanfall tystnar hackandet.',
        `${facebookBold('Gårdsanalytikern')}: "Hackandet tystnar bara tills nästa natt."`,
        facebookItalic('I bilden: Taleshönan vid tråget.'),
      ].join('\n\n'),
    )
    expect(text).not.toContain('EXTRA EXTRA')
  })
})
