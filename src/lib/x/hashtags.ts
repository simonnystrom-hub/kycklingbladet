export const X_POL_HASHTAG = 'svpol'
export const X_HASHTAG_MAX_EXTRA = 3

function normalizeHashtag(raw: string): string | null {
  const ascii = raw
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]/g, '')
  if (ascii.length < 2 || ascii.length > 24) return null
  return ascii
}

function rawTags(input: unknown): string[] {
  if (typeof input === 'string') {
    return input.split(/[\s,]+/)
  }
  if (Array.isArray(input)) {
    return input.filter((item): item is string => typeof item === 'string')
  }
  return []
}

export function parseHashtagSuggestions(input?: unknown): string[] {
  const seen = new Set<string>()
  const extras: string[] = []
  for (const raw of rawTags(input)) {
    const tag = normalizeHashtag(raw)
    if (!tag || tag === X_POL_HASHTAG || seen.has(tag)) continue
    seen.add(tag)
    extras.push(tag)
    if (extras.length === X_HASHTAG_MAX_EXTRA) break
  }
  return extras
}

export function xHashtagLine(input?: unknown): string {
  return [X_POL_HASHTAG, ...parseHashtagSuggestions(input)]
    .map((tag) => `#${tag}`)
    .join(' ')
}
