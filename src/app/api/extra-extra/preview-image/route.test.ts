import {describe, expect, it} from 'vitest'
import {parseExtraImageShotType} from '@/lib/generate/extra-image'
import {OPTIONS, POST} from './route'

describe('preview-image route', () => {
  it('exports HTTP handlers', () => {
    expect(typeof OPTIONS).toBe('function')
    expect(typeof POST).toBe('function')
  })

  it('accepts valid shot type overrides', () => {
    expect(parseExtraImageShotType('intervju')).toBe('intervju')
    expect(parseExtraImageShotType('invalid')).toBeNull()
  })
})
