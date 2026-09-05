import {afterEach, describe, expect, it, vi} from 'vitest'
import {extraExtraSecretOk} from './auth'

describe('extraExtraSecretOk', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts the configured secret', () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    const request = new Request('https://kycklingbladet.se/api/extra-extra/preview', {
      headers: {'x-extra-extra-secret': 'studio-secret'},
    })

    expect(extraExtraSecretOk(request)).toBe(true)
  })

  it('rejects a missing configured or supplied secret', () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', '')
    expect(extraExtraSecretOk(new Request('https://kycklingbladet.se'))).toBe(false)

    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')
    expect(extraExtraSecretOk(new Request('https://kycklingbladet.se'))).toBe(false)
  })

  it('rejects wrong secrets of equal or different lengths', () => {
    vi.stubEnv('EXTRA_EXTRA_SECRET', 'studio-secret')

    expect(
      extraExtraSecretOk(
        new Request('https://kycklingbladet.se', {
          headers: {'x-extra-extra-secret': 'studio-secrex'},
        }),
      ),
    ).toBe(false)
    expect(
      extraExtraSecretOk(
        new Request('https://kycklingbladet.se', {
          headers: {'x-extra-extra-secret': 'short'},
        }),
      ),
    ).toBe(false)
  })
})
