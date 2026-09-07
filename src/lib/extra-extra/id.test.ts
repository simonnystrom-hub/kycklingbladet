import {describe, expect, it} from 'vitest'
import {extraExtraId, extraExtraSlotFromId, nextExtraExtraSlot} from './id'

describe('extraExtraId', () => {
  it('prefixes the ISO date and appends slot 2+', () => {
    expect(extraExtraId('2026-09-05')).toBe('extra-extra-2026-09-05')
    expect(extraExtraId('2026-09-05', 1)).toBe('extra-extra-2026-09-05')
    expect(extraExtraId('2026-09-05', 2)).toBe('extra-extra-2026-09-05-2')
  })
})

describe('nextExtraExtraSlot', () => {
  it('starts at 1 and increments past existing ids', () => {
    expect(nextExtraExtraSlot([], '2026-09-05')).toBe(1)
    expect(nextExtraExtraSlot(['extra-extra-2026-09-05'], '2026-09-05')).toBe(2)
    expect(
      nextExtraExtraSlot(['extra-extra-2026-09-05', 'extra-extra-2026-09-05-3'], '2026-09-05'),
    ).toBe(4)
    expect(extraExtraSlotFromId('extra-extra-2026-09-05-2', '2026-09-05')).toBe(2)
  })
})
