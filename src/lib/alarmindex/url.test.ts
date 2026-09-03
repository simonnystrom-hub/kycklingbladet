import { describe, expect, it } from 'vitest'
import { alarmindexDayUrl } from './url'

describe('alarmindexDayUrl', () => {
  it('builds the locked day-newspaper path', () => {
    expect(alarmindexDayUrl('2026-09-03', 'expressen')).toBe(
      'https://alarmindex.com/dag/2026-09-03/expressen',
    )
  })
})
