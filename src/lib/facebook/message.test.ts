import {describe, expect, it} from 'vitest'
import {facebookExtraMessage, facebookLeadMessage} from './message'
import {facebookBoldCaps, facebookItalic} from './style-text'

const lead = {
  headline: 'Tvingades söka skydd i grannredet',
  body: 'Första stycket.\n\nAndra stycket.',
  expertVoice: 'Högsta hönset',
  expertHeadline: 'Så fungerar nödredet',
  expertText: 'Skyddet innebär trygghet.',
}

describe('facebookLeadMessage', () => {
  it('uses a bold-caps title, body, then italic caption', () => {
    const text = facebookLeadMessage({
      ...lead,
      imageCaption: 'Hönan vid luckan.',
      notices: [{headline: 'Glitterboll', body: 'Tuppen skadad.'}],
    })

    expect(text).toBe(
      [
        facebookBoldCaps('Tvingades söka skydd i grannredet'),
        'Första stycket.\n\nAndra stycket.',
        `I bilden: ${facebookItalic('Hönan vid luckan.')}`,
      ].join('\n\n'),
    )
    expect(text).not.toContain('Högsta hönset')
    expect(text).not.toContain('Notiser')
    expect(text).not.toContain('Se länk i kommentar')
  })

  it('omits the caption line when it is missing', () => {
    const text = facebookLeadMessage({...lead, imageCaption: '  ', notices: []})
    expect(text).not.toContain('I bilden:')
    expect(text).toBe(
      [facebookBoldCaps('Tvingades söka skydd i grannredet'), 'Första stycket.\n\nAndra stycket.'].join(
        '\n\n',
      ),
    )
  })
})

describe('facebookExtraMessage', () => {
  it('strips a leading EXTRA EXTRA from the body', () => {
    const text = facebookExtraMessage({
      headline: 'Putinsson slutar hugga',
      body: 'EXTRA EXTRA Efter månader av rävanfall tystnar hackandet.',
      imageCaption: 'Taleshönan vid tråget.',
    })

    expect(text).toBe(
      [
        facebookBoldCaps('EXTRA EXTRA'),
        facebookBoldCaps('Putinsson slutar hugga'),
        'Efter månader av rävanfall tystnar hackandet.',
        `I bilden: ${facebookItalic('Taleshönan vid tråget.')}`,
      ].join('\n\n'),
    )
  })
})
