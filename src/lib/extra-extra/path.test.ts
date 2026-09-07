import {describe, expect, it} from 'vitest'
import {extraExtraItemPath, extraExtraPath} from './path'

describe('extraExtraPath', () => {
  it('builds the canonical Extra Extra URL', () => {
    expect(extraExtraPath('2026-09-05')).toBe('/extra-extra/2026-09-05')
  })

  it('anchors a flash on the day’s Extra Extra page', () => {
    expect(extraExtraItemPath('2026-09-05', 'extra-extra-2026-09-05-2')).toBe(
      '/extra-extra/2026-09-05#extra-extra-2026-09-05-2',
    )
  })
})
