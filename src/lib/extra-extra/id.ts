export function extraExtraId(date: string, slot = 1): string {
  return slot <= 1 ? `extra-extra-${date}` : `extra-extra-${date}-${slot}`
}

export function extraExtraSlotFromId(id: string, date: string): number {
  if (id === extraExtraId(date)) return 1
  const prefix = `${extraExtraId(date)}-`
  if (!id.startsWith(prefix)) return 1
  const n = Number(id.slice(prefix.length))
  return Number.isInteger(n) && n > 1 ? n : 1
}

export function nextExtraExtraSlot(ids: string[], date: string): number {
  if (ids.length === 0) return 1
  return Math.max(...ids.map((id) => extraExtraSlotFromId(id, date))) + 1
}
