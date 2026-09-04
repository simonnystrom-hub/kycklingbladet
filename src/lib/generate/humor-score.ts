export function validateHumorScore(input: unknown): number | null {
  if (!input || typeof input !== 'object') return null
  const raw = (input as Record<string, unknown>).humorScore
  const value = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isInteger(value) || value < 1 || value > 100) return null
  return value
}
