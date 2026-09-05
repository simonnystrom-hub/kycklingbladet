import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

describe('IssueExtraTeaser', () => {
  it('links to the Extra Extra page and keeps the hash id', () => {
    const src = readFileSync('src/components/IssueExtraTeaser.tsx', 'utf8')
    expect(src).toContain('extraExtraPath(date)')
    expect(src).toContain('id="extra-extra"')
    expect(src).toContain('firstExtraParagraph')
  })
})

describe('extra extra page', () => {
  it('404s unless the date and extra are valid', () => {
    const src = readFileSync('src/app/extra-extra/[date]/page.tsx', 'utf8')
    expect(src).toContain('canShowExtraExtraPage')
    expect(src).toContain('notFound()')
    expect(src).toContain('<IssueExtra')
  })
})
