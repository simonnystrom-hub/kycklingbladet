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

  it('maps unknown hosts from the domain and rejects bad URLs', () => {
    expect(resolveNewspaper('https://example.com/nyhet')).toEqual({
      name: 'Example',
      slug: 'example',
    })
    expect(resolveNewspaper('https://www.gp.se/nyheter/x')).toEqual({name: 'GP', slug: 'gp'})
    expect(resolveNewspaper('https://alarmindex.com/dag/2026-09-03/expressen')).toEqual({
      name: 'Alarmindex',
      slug: 'alarmindex',
    })
    expect(resolveNewspaper('not-a-url')).toBeNull()
    expect(resolveNewspaper('https://constructor/')).toBeNull()
    expect(resolveNewspaper('ftp://expressen.se/x')).toBeNull()
  })
})
