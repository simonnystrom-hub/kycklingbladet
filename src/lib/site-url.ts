export const CANONICAL_SITE_URL = 'https://www.kycklingbladet.com'

export function getSiteUrl(): string {
  return CANONICAL_SITE_URL
}

export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${suffix}`
}
