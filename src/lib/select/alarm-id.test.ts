import { describe, expect, it } from 'vitest'
import { alarmIdForDate, parseAlarmSlot, shouldCreateAlarm } from './alarm-id'
import { formatSwedishDateShort, isIsoDateString, stockholmToday } from './stockholm-date'

describe('alarmIdForDate', () => {
  it('prefixes the ISO date', () => {
    expect(alarmIdForDate('2026-09-03')).toBe('alarm-2026-09-03')
  })

  it('suffixes slot 2 and 3', () => {
    expect(alarmIdForDate('2026-09-03', 2)).toBe('alarm-2026-09-03-2')
    expect(alarmIdForDate('2026-09-03', 3)).toBe('alarm-2026-09-03-3')
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

describe('parseAlarmSlot', () => {
  it('treats missing slot as 1', () => {
    expect(parseAlarmSlot(undefined)).toBe(1)
    expect(parseAlarmSlot(2)).toBe(2)
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

describe('formatSwedishDateShort', () => {
  it('renders the calendar day without a weekday', () => {
    expect(formatSwedishDateShort('2026-09-02')).toBe('2 september 2026')
  })
})
