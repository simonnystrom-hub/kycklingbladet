export type ExtraPaper = {name: string; slug: string}

const PAPERS: Record<string, ExtraPaper> = {
  'expressen.se': {name: 'Expressen', slug: 'expressen'},
  'aftonbladet.se': {name: 'Aftonbladet', slug: 'aftonbladet'},
  'sydsvenskan.se': {name: 'Sydsvenskan', slug: 'sydsvenskan'},
  'dn.se': {name: 'DN', slug: 'dn'},
  'svd.se': {name: 'SvD', slug: 'svd'},
}

function paperFromHost(host: string): ExtraPaper {
  const label = host.split('.')[0] ?? host
  const slug = label.replace(/[^a-z0-9-]/g, '') || 'tidning'
  const name =
    label.length <= 3
      ? label.toUpperCase()
      : label
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-')
  return {name, slug}
}

export function resolveNewspaper(articleUrl: string): ExtraPaper | null {
  let url: URL
  try {
    url = new URL(articleUrl)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (!host.includes('.')) return null
  if (Object.hasOwn(PAPERS, host)) return PAPERS[host]
  return paperFromHost(host)
}

