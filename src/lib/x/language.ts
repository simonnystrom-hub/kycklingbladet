export type XCopyLanguage = 'sv' | 'en'

const SV_FUNCTION_WORDS = new Set([
  'och',
  'att',
  'det',
  'som',
  'för',
  'är',
  'på',
  'en',
  'ett',
  'den',
  'har',
  'inte',
  'om',
  'med',
  'till',
  'från',
  'kan',
  'ska',
  'var',
  'jag',
  'du',
  'vi',
  'ni',
  'de',
  'av',
])

const EN_FUNCTION_WORDS = new Set([
  'the',
  'and',
  'is',
  'to',
  'of',
  'you',
  'that',
  'in',
  'it',
  'for',
  'on',
  'are',
  'with',
  'this',
  'be',
  'as',
  'at',
  'or',
  'from',
  'have',
  'not',
  'was',
  'but',
])

export function parseXCopyLanguage(input: unknown): XCopyLanguage | null {
  if (input === 'sv' || input === 'en') return input
  return null
}

export function detectXCopyLanguage(text: string): XCopyLanguage {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return 'sv'
  if (/[åäö]/.test(normalized)) return 'sv'

  const tokens = normalized.split(/[^a-zåäö]+/).filter((word) => word.length >= 2)
  let swedish = 0
  let english = 0
  for (const word of tokens) {
    if (SV_FUNCTION_WORDS.has(word)) swedish += 1
    if (EN_FUNCTION_WORDS.has(word)) english += 1
  }
  if (english > swedish) return 'en'
  return 'sv'
}

export function resolveXCopyLanguage(input: {
  text: string
  language?: unknown
}): XCopyLanguage {
  return parseXCopyLanguage(input.language) ?? detectXCopyLanguage(input.text)
}
