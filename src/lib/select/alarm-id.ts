export function alarmIdForDate(date: string): string {
  return `alarm-${date}`
}

export function shouldCreateAlarm(existingId: string | null): boolean {
  return existingId == null
}
