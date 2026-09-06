import {createClient} from '@sanity/client'
import {envSecret} from '@/lib/env-secret'
import {apiVersion, dataset, projectId} from './client'

export function getWriteClient() {
  const token = envSecret(process.env.SANITY_API_WRITE_TOKEN)
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN saknas')
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token })
}
