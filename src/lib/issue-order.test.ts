import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

describe('issue order', () => {
  it('puts IssueExtra above Dagens nyheter on home', () => {
    const src = readFileSync('src/app/page.tsx', 'utf8')
    expect(src.indexOf('<IssueExtra ')).toBeGreaterThan(-1)
    expect(src.indexOf('<IssueExtra ')).toBeLessThan(
      src.indexOf('<SectionHead>{TODAY_ISSUE_HEADING}'),
    )
  })

  it('redirects the archive date page and keeps Extra Extra off larm pages', () => {
    const datePage = readFileSync('src/app/arkiv/[date]/page.tsx', 'utf8')
    const larmPage = readFileSync('src/app/arkiv/[date]/[slug]/page.tsx', 'utf8')
    expect(datePage).toContain('permanentRedirect')
    expect(datePage).not.toContain('IssueExtraTeaser')
    expect(larmPage).toContain('<AlarmArticle')
    expect(larmPage).not.toContain('IssueExtra')
    expect(larmPage).not.toContain('IssueNotices')
  })

  it('lists three larm on home without notices', () => {
    const src = readFileSync('src/app/page.tsx', 'utf8')
    expect(src).toContain('getAlarmsByDate')
    expect(src).toContain('<AlarmArticle')
    expect(src).not.toContain('IssueNotices')
  })
})

describe('vercel analytics', () => {
  it('loads Web Analytics in the root layout', () => {
    const src = readFileSync('src/app/layout.tsx', 'utf8')
    expect(src).toContain("from '@vercel/analytics/next'")
    expect(src).toContain('<Analytics />')
  })
})
