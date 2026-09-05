import {describe, expect, it} from 'vitest'
import {extraExtraPath} from './path'

describe('extraExtraPath', () => {
  it('builds the canonical Extra Extra URL', () => {
    expect(extraExtraPath('2026-09-05')).toBe('/extra-extra/2026-09-05')
  })
})
