export type ExtraPaper = {name: string; slug: string}

const PAPERS: Record<string, ExtraPaper> = {
  'expressen.se': {name: 'Expressen', slug: 'expressen'},
  'aftonbladet.se': {name: 'Aftonbladet', slug: 'aftonbladet'},
  'sydsvenskan.se': {name: 'Sydsvenskan', slug: 'sydsvenskan'},
  'dn.se': {name: 'DN', slug: 'dn'},
  'svd.se': {name: 'SvD', slug: 'svd'},
}

export function resolveNewspaper(articleUrl: string): ExtraPaper | null {
  let host: string
  try {
    host = new URL(articleUrl).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  if (!Object.hasOwn(PAPERS, host)) {
    return null
  }
  return PAPERS[host]
}
