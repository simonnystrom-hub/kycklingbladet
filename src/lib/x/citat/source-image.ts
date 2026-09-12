export const CITAT_SOURCE_IMAGE_MAX_BYTES = 4 * 1024 * 1024

export type CitatSourceImage = {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  base64: string
}

function parseMimeType(value: unknown): CitatSourceImage['mimeType'] | null {
  if (value === 'image/jpg' || value === 'image/jpeg') return 'image/jpeg'
  if (value === 'image/png' || value === 'image/webp') return value
  return null
}

export function parseCitatSourceImage(input: unknown): CitatSourceImage | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const value = input as Record<string, unknown>
  const mimeType = parseMimeType(value.mimeType)
  if (!mimeType) return null
  if (typeof value.base64 !== 'string' || !value.base64.trim()) return null
  const base64 = value.base64
    .trim()
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
    .replace(/\s/g, '')
  if (base64.length < 16) return null
  if (Math.floor((base64.length * 3) / 4) > CITAT_SOURCE_IMAGE_MAX_BYTES) return null
  if (!/^[A-Za-z0-9+/]+=*$/.test(base64)) return null
  return {mimeType, base64}
}

export function parseManualSpeechBubble(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const text = input.trim()
  if (!text || text.length > 80) return null
  if (/https?:\/\//i.test(text)) return null
  return text
}
