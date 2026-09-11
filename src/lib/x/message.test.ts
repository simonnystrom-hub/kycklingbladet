import {describe, expect, it} from 'vitest'
import {xExpertBlock, xExtraMessage, xLeadMessage} from './message'

const lead = {
  headline: 'Tvingades söka skydd i grannredet',
  body: 'Första stycket.\n\nAndra stycket.',
  expertVoice: 'Högsta hönset',
  expertHeadline: 'Så fungerar nödredet',
  expertText: 'Skyddet innebär trygghet.',
}

describe('xLeadMessage', () => {
  it('uses a plain title, body, expert quote, caption and article URL', () => {
    const text = xLeadMessage(
      {
        ...lead,
        imageCaption: 'Hönan vid luckan.',
        notices: [{headline: 'Glitterboll', body: 'Tuppen skadad.'}],
      },
      'https://www.kycklingbladet.com/arkiv/2026-09-05/luckan',
    )

    expect(text).toBe(
      [
        'Tvingades söka skydd i grannredet',
        'Första stycket.\n\nAndra stycket.',
        'Högsta hönset: "Skyddet innebär trygghet."',
        'I bilden: Hönan vid luckan.',
        '#svpol',
        'https://www.kycklingbladet.com/arkiv/2026-09-05/luckan',
      ].join('\n\n'),
    )
    expect(text).not.toContain('Notiser')
    expect(text).not.toContain('Se länk i kommentar')
  })

  it('omits caption, expert and URL when they are missing', () => {
    const text = xLeadMessage({
      headline: lead.headline,
      body: lead.body,
      expertVoice: '  ',
      expertText: '',
      imageCaption: '  ',
      notices: [],
    })
    expect(text).not.toContain('I bilden:')
    expect(text).not.toContain('Högsta hönset')
    expect(text).toBe(['Tvingades söka skydd i grannredet', 'Första stycket.\n\nAndra stycket.', '#svpol'].join('\n\n'))
  })
})

describe('xExpertBlock', () => {
  it('keeps existing wrapping quotes', () => {
    expect(
      xExpertBlock({
        expertVoice: 'Överhönan',
        expertText: '"Sitt inte med ryggen mot luckan."',
      }),
    ).toBe('Överhönan: "Sitt inte med ryggen mot luckan."')
  })
})

describe('xExtraMessage', () => {
  it('omits the EXTRA EXTRA stamp and puts the URL last', () => {
    const text = xExtraMessage(
      {
        headline: 'Putinsson slutar hugga',
        body: 'EXTRA EXTRA Efter månader av rävanfall tystnar hackandet.',
        imageCaption: 'Taleshönan vid tråget.',
        expertVoice: 'Gårdsanalytikern',
        expertText: 'Hackandet tystnar bara tills nästa natt.',
      },
      'https://www.kycklingbladet.com/extra-extra/2026-09-05',
    )

    expect(text).toBe(
      [
        'Putinsson slutar hugga',
        'Efter månader av rävanfall tystnar hackandet.',
        'Gårdsanalytikern: "Hackandet tystnar bara tills nästa natt."',
        'I bilden: Taleshönan vid tråget.',
        '#svpol',
        'https://www.kycklingbladet.com/extra-extra/2026-09-05',
      ].join('\n\n'),
    )
    expect(text).not.toContain('EXTRA EXTRA')
  })

  it('appends suggested tags after #svpol', () => {
    expect(
      xExtraMessage(
        {headline: 'Nato-kackel', body: 'Gården rustar.'},
        null,
        ['#Försvar', 'nato'],
      ),
    ).toContain('#svpol #forsvar #nato')
  })
})
