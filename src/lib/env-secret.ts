/** Strip quotes, BOM and newlines so the value is safe in HTTP headers. */
export function envSecret(value: string | undefined | null): string {
  let text = (value ?? '').replace(/^\uFEFF/, '').trim()
  if (text.length >= 2) {
    const quote = text[0]
    if ((quote === '"' || quote === "'") && text.endsWith(quote)) {
      text = text.slice(1, -1).trim()
    }
  }
  return text.replace(/[\r\n]+/g, '')
}
