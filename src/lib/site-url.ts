const FALLBACK_SITE_URL = 'https://kycklingbladet.vercel.app'

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL
  return raw.replace(/\/$/, '')
}

export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${suffix}`
}
