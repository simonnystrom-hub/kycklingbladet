export function alarmIdForDate(date: string, slot: number = 1): string {
  if (slot <= 1) return `alarm-${date}`
  return `alarm-${date}-${slot}`
}

export function parseAlarmSlot(value: unknown): 1 | 2 | 3 {
  if (value === 2 || value === 3) return value
  return 1
}

export function shouldCreateAlarm(existingId: string | null): boolean {
  return existingId == null
}
