import {describe, expect, it} from 'vitest'
import {alarmPath, alarmSlug, alarmSlugOrFallback, uniqueAlarmSlug} from './alarm-path'

describe('alarmSlug', () => {
  it('lowercases Swedish headlines and keeps åäö', () => {
    expect(alarmSlug('Tuppen på Gården')).toBe('tuppen-på-gården')
  })
})

describe('uniqueAlarmSlug', () => {
  it('suffixes when the base slug is taken', () => {
    expect(uniqueAlarmSlug('Luckan', ['luckan'])).toBe('luckan-2')
  })
})

describe('alarmPath', () => {
  it('builds the canonical larm URL', () => {
    expect(alarmPath('2026-09-05', 'luckan')).toBe('/arkiv/2026-09-05/luckan')
  })
})

describe('alarmSlugOrFallback', () => {
  it('uses a stored slug when present', () => {
    expect(alarmSlugOrFallback('Luckan', 'custom')).toBe('custom')
    expect(alarmSlugOrFallback('Tuppen på Gården', null)).toBe('tuppen-på-gården')
  })

  it('decodes a percent-encoded slug', () => {
    expect(alarmSlugOrFallback('Luckan', 'tuppen-p%C3%A5-g%C3%A5rden')).toBe('tuppen-på-gården')
  })
})
