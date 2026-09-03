import {createClient, type SanityClient} from '@sanity/client'

const DATASET_PATTERN = /^~?[a-z0-9_-]{1,64}$/

function normalizeDataset(value: string | undefined): string {
  const normalized = (value?.trim() || 'production').toLowerCase()
  if (!DATASET_PATTERN.test(normalized)) {
    console.warn(
      `[sanity] Invalid NEXT_PUBLIC_SANITY_DATASET "${value ?? ''}", using "production".`,
    )
    return 'production'
  }
  return normalized
}

export const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id').trim()
export const dataset = normalizeDataset(process.env.NEXT_PUBLIC_SANITY_DATASET)
export const apiVersion = (
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-01'
).trim()

let cachedClient: SanityClient | null = null

export function isKycklingbladetConfigured(): boolean {
  return Boolean(projectId && projectId !== 'your-project-id')
}

export function getSanityClient(): SanityClient {
  if (!cachedClient) {
    cachedClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: process.env.NODE_ENV === 'production',
      perspective: 'published',
    })
  }
  return cachedClient
}
