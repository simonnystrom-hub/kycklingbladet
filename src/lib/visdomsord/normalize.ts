export function normalizeQuoteKey(quote: string): string {
  let text = quote.trim().toLocaleLowerCase('sv')
  text = text.replace(/^[«»""]+/, '').replace(/[«»""]+$/, '')
  text = text.replace(/[!?.]+$/g, '')
  return text.replace(/\s+/g, ' ').trim()
}
