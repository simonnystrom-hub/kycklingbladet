import {describe, expect, it} from 'vitest'
import {addIsoDays} from './select/stockholm-date'
import {pickWeekLeads, weekLeadStart} from './week-leads'

describe('weekLeadStart', () => {
  it('opens seven calendar days before today', () => {
    expect(addIsoDays('2026-09-04', -7)).toBe('2026-08-28')
    expect(weekLeadStart('2026-09-04')).toBe('2026-08-28')
  })
})

describe('pickWeekLeads', () => {
  const items = [
    {date: '2026-09-04', humorScore: 99, headline: 'today'},
    {date: '2026-09-03', humorScore: 40, headline: 'mid'},
    {date: '2026-09-02', humorScore: 88, headline: 'funny'},
    {date: '2026-09-01', humorScore: 88, headline: 'also-funny-older'},
    {date: '2026-08-27', humorScore: 95, headline: 'too-old'},
    {date: '2026-08-30', headline: 'unscored'},
  ]

  it('takes the two highest scores in the last seven days, excluding today and the shown date', () => {
    const picked = pickWeekLeads(items, '2026-09-04', '2026-09-04')
    expect(picked.map((item) => item.headline)).toEqual(['funny', 'also-funny-older'])
  })

  it('does not repeat the article shown below as dagens nummer', () => {
    const picked = pickWeekLeads(items, '2026-09-04', '2026-09-02')
    expect(picked.map((item) => item.headline)).toEqual(['also-funny-older', 'mid'])
  })
})
