export type VisdomsordDraft = {quote: string; henName: string}

function firstJsonArray(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const source = fenced?.[1] ?? text
  const start = source.indexOf('[')
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < source.length; index += 1) {
    const character = source[index]
    if (inString) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }

    if (character === '"') inString = true
    else if (character === '[') depth += 1
    else if (character === ']') {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }

  return null
}

export function parseVisdomsordDrafts(text: string): VisdomsordDraft[] {
  const json = firstJsonArray(text)
  if (!json) return []

  try {
    const parsed: unknown = JSON.parse(json)
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
