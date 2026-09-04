import {isExpertVoice, type ExpertVoice} from './experts'

export type GeneratedAlarm = {
  kicker: string
  headline: string
  body: string
  expertVoice: ExpertVoice
  expertHeadline: string
  expertText: string
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
  const expertVoice = asNonEmpty(record.expertVoice)
  const expertHeadline = asNonEmpty(record.expertHeadline)
  const expertText = asNonEmpty(record.expertText)
  if (!kicker || !headline || !body || !expertVoice || !expertHeadline || !expertText) {
    return null
  }
  if (!isExpertVoice(expertVoice)) return null
  return {kicker, headline, body, expertVoice, expertHeadline, expertText}
}
