import {describe, expect, it} from 'vitest'
import {parseCitatSourceImage, parseManualSpeechBubble} from './source-image'

describe('parseCitatSourceImage', () => {
  it('accepts jpeg png and webp', () => {
    const base64 = 'a'.repeat(24)
    expect(parseCitatSourceImage({mimeType: 'image/jpeg', base64})).toEqual({
      mimeType: 'image/jpeg',
      base64,
    })
    expect(parseCitatSourceImage({mimeType: 'image/jpg', base64})?.mimeType).toBe('image/jpeg')
    expect(parseCitatSourceImage({mimeType: 'image/png', base64})?.mimeType).toBe('image/png')
    expect(parseCitatSourceImage({mimeType: 'image/webp', base64})?.mimeType).toBe('image/webp')
  })

  it('strips a data URL prefix', () => {
    const base64 = 'a'.repeat(24)
    expect(
      parseCitatSourceImage({
        mimeType: 'image/png',
        base64: `data:image/png;base64,${base64}`,
      }),
    ).toEqual({mimeType: 'image/png', base64})
  })

  it('rejects junk and oversized payloads', () => {
    expect(parseCitatSourceImage({mimeType: 'image/gif', base64: 'a'.repeat(24)})).toBeNull()
    expect(parseCitatSourceImage({mimeType: 'image/jpeg', base64: 'nope'})).toBeNull()
    expect(parseCitatSourceImage({mimeType: 'image/jpeg', base64: ''})).toBeNull()
    expect(
      parseCitatSourceImage({mimeType: 'image/jpeg', base64: 'a'.repeat(6_000_000)}),
    ).toBeNull()
  })
})

describe('parseManualSpeechBubble', () => {
  it('keeps a short custom balloon', () => {
    expect(parseManualSpeechBubble('  Kackel!  ')).toBe('Kackel!')
  })

  it('rejects empty, long, or URL balloons', () => {
    expect(parseManualSpeechBubble('')).toBeNull()
    expect(parseManualSpeechBubble('x'.repeat(81))).toBeNull()
    expect(parseManualSpeechBubble('Se https://x.com/x')).toBeNull()
  })
})
