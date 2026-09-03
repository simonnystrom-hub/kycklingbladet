export type GeneratedAlarm = {
  kicker: string
  headline: string
  body: string
  survivalTip: string
}

function asNonEmpty(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function validateGeneratedAlarm(input: unknown): GeneratedAlarm | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Record<string, unknown>
  const kicker = asNonEmpty(record.kicker)
  const headline = asNonEmpty(record.headline)
  const body = asNonEmpty(record.body)
  const survivalTip = asNonEmpty(record.survivalTip)
  if (!kicker || !headline || !body || !survivalTip) return null
  return { kicker, headline, body, survivalTip }
}
