const BOLD_CAPITAL_A = 0x1d5d4
const BOLD_SMALL_A = 0x1d5ee
const BOLD_DIGIT_ZERO = 0x1d7ec
const ITALIC_CAPITAL_A = 0x1d608
const ITALIC_SMALL_A = 0x1d622

function mapRange(code: number, from: number, to: number, base: number): number | null {
  if (code < from || code > to) return null
  return base + (code - from)
}

function styleLatin(
  text: string,
  capitalBase: number,
  smallBase: number,
  digitBase: number | null,
): string {
  let out = ''
  for (const char of text) {
    const code = char.codePointAt(0)
    if (code === undefined) continue
    const styled =
      mapRange(code, 65, 90, capitalBase) ??
      mapRange(code, 97, 122, smallBase) ??
      (digitBase === null ? null : mapRange(code, 48, 57, digitBase))
    out += styled === null ? char : String.fromCodePoint(styled)
  }
  return out
}

export function facebookBoldCaps(text: string): string {
  return styleLatin(text.toLocaleUpperCase('sv-SE'), BOLD_CAPITAL_A, BOLD_SMALL_A, BOLD_DIGIT_ZERO)
}

export function facebookItalic(text: string): string {
  return styleLatin(text, ITALIC_CAPITAL_A, ITALIC_SMALL_A, null)
}

export function formatFacebookBody(body: string): string {
  return body
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n'),
    )
    .filter((paragraph) => paragraph.length > 0)
    .join('\n\n')
}
