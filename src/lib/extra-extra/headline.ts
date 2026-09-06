const PAPER_NAMES = new Set([
  'Expressen',
  'Aftonbladet',
  'Sydsvenskan',
  'DN',
  'SvD',
  'Dagens Nyheter',
  'Svenska Dagbladet',
])

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

export function cleanScrapedHeadline(raw: string, extraNames: string[] = []): string {
  const trimmed = raw.trim()
  const names = new Set(
    [...PAPER_NAMES, ...extraNames].map((name) => name.trim().toLowerCase()).filter(Boolean),
  )

  for (const sep of [' | ', ' - ']) {
    const idx = trimmed.lastIndexOf(sep)
    if (idx === -1) continue
    const left = trimmed.slice(0, idx)
    const right = trimmed.slice(idx + sep.length)
    if (names.has(right.trim().toLowerCase())) {
      return left.trim()
    }
  }

  return trimmed
}

function getMetaAttribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`, 'i'))
  return match ? match[1] : null
}

function extractMetaTitle(html: string): string | null {
  const metaRegex = /<meta\s+[^>]*>/gi
  for (const match of html.matchAll(metaRegex)) {
    const tag = match[0]
    const isTitle =
      getMetaAttribute(tag, 'property') === 'og:title' ||
      getMetaAttribute(tag, 'name') === 'twitter:title'
    if (!isTitle) continue
    const content = getMetaAttribute(tag, 'content')
    if (content !== null) return content
  }
  return null
}

function extractH1(html: string): string | null {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  return match ? match[1] : null
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? match[1] : null
}

export function extractHeadlineFromHtml(html: string, extraNames: string[] = []): string | null {
  const raw = extractMetaTitle(html) ?? extractH1(html) ?? extractTitle(html)
  if (raw === null) return null

  const decoded = decodeHtmlEntities(raw)
  const cleaned = cleanScrapedHeadline(decoded, extraNames)
  return cleaned.length === 0 ? null : cleaned
}
