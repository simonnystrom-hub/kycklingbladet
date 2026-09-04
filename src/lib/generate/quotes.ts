export function normalizeQuotes(value: string): string {
  return value.replaceAll('«', '"').replaceAll('»', '"')
}
