export type VisdomsordDraft = {quote: string; henName: string}

export function parseVisdomsordDrafts(text: string): VisdomsordDraft[] {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start < 0 || end < start) return []

  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1))
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((item): VisdomsordDraft[] => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return []
      const candidate = item as Record<string, unknown>
      if (typeof candidate.quote !== 'string' || typeof candidate.henName !== 'string') {
        return []
      }

      const quote = candidate.quote.trim()
      const henName = candidate.henName.trim()
      return quote && henName ? [{quote, henName}] : []
    })
  } catch {
    return []
  }
}
