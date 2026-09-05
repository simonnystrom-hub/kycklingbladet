import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

describe('issue order', () => {
  it('puts IssueExtra above Dagens nyheter on home', () => {
    const src = readFileSync('src/app/page.tsx', 'utf8')
    expect(src.indexOf('<IssueExtra')).toBeGreaterThan(-1)
    expect(src.indexOf('<IssueExtra')).toBeLessThan(
      src.indexOf('<SectionHead>{TODAY_ISSUE_HEADING}'),
    )
  })

  it('puts IssueExtra before AlarmArticle on archive', () => {
    const src = readFileSync('src/app/arkiv/[date]/page.tsx', 'utf8')
    expect(src.indexOf('<IssueExtra')).toBeLessThan(src.indexOf('<AlarmArticle'))
  })
})
