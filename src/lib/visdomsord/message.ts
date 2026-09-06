export function wrapWisdomQuote(quote: string): string {
  const trimmed = quote.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('“') && trimmed.endsWith('”'))
  ) {
    return trimmed
  }
  return `"${trimmed}"`
}

export function facebookWisdomMessage(input: {quote: string; henName: string}): string {
  return ['KUCKELIKUUUU!', wrapWisdomQuote(input.quote), input.henName.trim()].join('\n\n')
}
