export function normalizeQuoteKey(quote: string): string {
  let text = quote.trim().toLocaleLowerCase('sv')
  text = text.replace(/^[«»"\u201C\u201D]+/, '').replace(/[«»"\u201C\u201D]+$/, '')
  text = text.replace(/[!?.]+$/g, '')
  return text.replace(/\s+/g, ' ').trim()
}
