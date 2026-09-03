import { describe, expect, it } from 'vitest'
import { alarmIdForDate, shouldCreateAlarm } from './alarm-id'
import { isIsoDateString, stockholmToday } from './stockholm-date'

describe('alarmIdForDate', () => {
  it('prefixes the ISO date', () => {
    expect(alarmIdForDate('2026-09-03')).toBe('alarm-2026-09-03')
  })
})

describe('shouldCreateAlarm', () => {
  it('creates when nothing exists', () => {
    expect(shouldCreateAlarm(null)).toBe(true)
  })

  it('skips when a document id is already present', () => {
    expect(shouldCreateAlarm('alarm-2026-09-03')).toBe(false)
    expect(shouldCreateAlarm('drafts.alarm-2026-09-03')).toBe(false)
  })
})

describe('stockholmToday', () => {
  it('formats a known instant as a Stockholm calendar day', () => {
    // 2026-09-03 00:30 in Stockholm is still 2026-09-02 22:30 UTC
    expect(stockholmToday(new Date('2026-09-02T22:30:00Z'))).toBe('2026-09-03')
    expect(stockholmToday(new Date('2026-09-03T22:30:00Z'))).toBe('2026-09-04')
  })
})

describe('isIsoDateString', () => {
  it('accepts YYYY-MM-DD and rejects common typos', () => {
    expect(isIsoDateString('2026-09-03')).toBe(true)
    expect(isIsoDateString('2026-9-3')).toBe(false)
    expect(isIsoDateString('2026/09/03')).toBe(false)
    expect(isIsoDateString('')).toBe(false)
  })
})
