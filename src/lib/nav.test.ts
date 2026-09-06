import { describe, expect, it } from 'vitest'
import { ARCHIVE_PAGE_SIZE, archivePageWindow, NAV_LINKS } from './nav'

describe('NAV_LINKS', () => {
  it('labels the home link Dagens nyheter', () => {
    expect(NAV_LINKS[0]).toEqual({ href: '/', label: 'Dagens nyheter' })
  })

  it('links to the public quotes page after the archive', () => {
    expect(NAV_LINKS[1]).toEqual({ href: '/arkiv', label: 'Arkiv' })
    expect(NAV_LINKS[2]).toEqual({ href: '/citat', label: 'Citat' })
  })
})

describe('archivePageWindow', () => {
  it('clamps to a single page when the archive is empty', () => {
    expect(archivePageWindow(0, 1)).toEqual({ current: 1, pageCount: 1, start: 0 })
  })

  it('splits ten items across two pages of seven', () => {
    expect(archivePageWindow(10, 1)).toEqual({ current: 1, pageCount: 2, start: 0 })
    expect(archivePageWindow(10, 2).start).toBe(ARCHIVE_PAGE_SIZE)
  })

  it('clamps out-of-range pages', () => {
    expect(archivePageWindow(10, 0).current).toBe(1)
    expect(archivePageWindow(10, 99).current).toBe(2)
  })
})
