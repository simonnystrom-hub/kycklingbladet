export function normalizeQuotes(value: string): string {
  return value.replaceAll('«', '"').replaceAll('»', '"')
}

export function wrapStraightQuotes(value: string): string {
  const trimmed = normalizeQuotes(value.trim())
  if (!trimmed) return ''
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed
  if (trimmed.startsWith('“') && trimmed.endsWith('”')) {
    return `"${trimmed.slice(1, -1)}"`
  }
  return `"${trimmed}"`
}
