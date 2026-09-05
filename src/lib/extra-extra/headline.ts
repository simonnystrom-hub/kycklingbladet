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

export function cleanScrapedHeadline(raw: string): string {
  const trimmed = raw.trim()

  for (const sep of [' | ', ' - ']) {
    const idx = trimmed.lastIndexOf(sep)
    if (idx === -1) continue
    const left = trimmed.slice(0, idx)
    const right = trimmed.slice(idx + sep.length)
    if (PAPER_NAMES.has(right)) {
      return left.trim()
    }
  }

  return trimmed
}

function extractMetaTitle(html: string): string | null {
  const metaRegex = /<meta\s+[^>]*>/gi
  for (const match of html.matchAll(metaRegex)) {
    const tag = match[0]
    const isTitle =
      /property\s*=\s*["']og:title["']/i.test(tag) ||
      /name\s*=\s*["']twitter:title["']/i.test(tag)
    if (!isTitle) continue
    const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i)
    if (contentMatch) return contentMatch[1]
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

export function extractHeadlineFromHtml(html: string): string | null {
  const raw = extractMetaTitle(html) ?? extractH1(html) ?? extractTitle(html)
  if (raw === null) return null

  const decoded = decodeHtmlEntities(raw)
  const cleaned = cleanScrapedHeadline(decoded)
  return cleaned.length === 0 ? null : cleaned
}
