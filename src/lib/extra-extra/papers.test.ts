import {describe, expect, it} from 'vitest'
import {resolveNewspaper} from './papers'

describe('resolveNewspaper', () => {
  it('maps known tabloid hosts', () => {
    expect(resolveNewspaper('https://www.expressen.se/nyheter/foo/')).toEqual({
      name: 'Expressen',
      slug: 'expressen',
    })
    expect(resolveNewspaper('https://aftonbladet.se/a/xyz')).toEqual({
      name: 'Aftonbladet',
      slug: 'aftonbladet',
    })
    expect(resolveNewspaper('https://www.sydsvenskan.se/2026-08-31/foo')).toEqual({
      name: 'Sydsvenskan',
      slug: 'sydsvenskan',
    })
    expect(resolveNewspaper('https://www.dn.se/sverige/foo/')).toEqual({name: 'DN', slug: 'dn'})
    expect(resolveNewspaper('https://www.svd.se/a/foo')).toEqual({name: 'SvD', slug: 'svd'})
  })

  it('rejects unknown hosts and bad URLs', () => {
    expect(resolveNewspaper('https://example.com/nyhet')).toBeNull()
    expect(resolveNewspaper('https://alarmindex.com/dag/2026-09-03/expressen')).toBeNull()
    expect(resolveNewspaper('not-a-url')).toBeNull()
  })
})
