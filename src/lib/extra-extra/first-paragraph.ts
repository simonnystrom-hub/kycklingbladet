export function firstExtraParagraph(body: string): string {
  return body.split('\n\n').filter(Boolean)[0] ?? ''
}
