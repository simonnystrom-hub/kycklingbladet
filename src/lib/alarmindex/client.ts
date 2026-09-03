import {createClient, type SanityClient} from '@sanity/client'

const DATASET_PATTERN = /^~?[a-z0-9_-]{1,64}$/

function normalizeDataset(value: string | undefined): string {
  const normalized = (value?.trim() || 'production').toLowerCase()
  if (!DATASET_PATTERN.test(normalized)) {
    console.warn(
      `[alarmindex] Invalid ALARMINDEX_SANITY_DATASET "${value ?? ''}", using "production".`,
    )
    return 'production'
  }
  return normalized
}

export const projectId = (process.env.ALARMINDEX_SANITY_PROJECT_ID || '').trim()
export const dataset = normalizeDataset(process.env.ALARMINDEX_SANITY_DATASET)
export const apiVersion = (
  process.env.ALARMINDEX_SANITY_API_VERSION || '2025-01-01'
).trim()

let cachedClient: SanityClient | null = null

export function isAlarmindexConfigured(): boolean {
  return Boolean(projectId)
}

export function getAlarmindexClient(): SanityClient {
  if (!projectId) {
    throw new Error('ALARMINDEX_SANITY_PROJECT_ID saknas')
  }

  if (!cachedClient) {
    const token = process.env.ALARMINDEX_SANITY_READ_TOKEN?.trim() || undefined
    cachedClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      perspective: 'published',
      ...(token ? {token} : {}),
    })
  }
  return cachedClient
}
