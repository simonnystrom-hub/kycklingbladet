import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {NAV_LINKS} from './nav'

describe('citat page', () => {
  it('is linked from the main navigation', () => {
    expect(NAV_LINKS.some((link) => link.href === '/citat' && link.label === 'Citat')).toBe(
      true,
    )
  })

  it('loads published visdomsord that have cartoons', () => {
    const page = readFileSync('src/app/citat/page.tsx', 'utf8')
    const query = readFileSync('src/lib/sanity/queries.ts', 'utf8')
    expect(page).toContain('getVisdomsordWithImages')
    expect(readFileSync('src/components/CitatList.tsx', 'utf8')).toContain('wrapWisdomQuote')
    expect(query).toContain('_type == "visdomsord"')
    expect(query).toContain('defined(image.asset)')
  })
})
