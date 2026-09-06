import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {getWriteClient} from '@/lib/sanity/write-client'
import {generateVisdomsordDrafts} from '@/lib/visdomsord/generate'
import {createVisdomsord} from '@/lib/visdomsord/persist'

export const maxDuration = 60

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {status, headers: corsHeaders()})
}

export function OPTIONS() {
  return new Response(null, {status: 204, headers: corsHeaders()})
}

export async function POST(request: Request) {
  if (!extraExtraSecretOk(request)) {
    return json({error: 'Ej behörig'}, 401)
  }

  try {
    const input: unknown = await request.json()
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Ogiltig förfrågan')
    }

    const requestedCount = (input as Record<string, unknown>).count
    if (requestedCount !== undefined && (
      typeof requestedCount !== 'number' ||
      !Number.isFinite(requestedCount)
    )) {
      throw new Error('Ogiltig förfrågan')
    }
    const count = Math.max(0, Math.min(100, Math.floor(requestedCount ?? 100)))

    const existingQuotes = await getWriteClient().fetch<string[]>(
      '*[_type == "visdomsord"].quote',
    )
    const drafts = await generateVisdomsordDrafts({count, existingQuotes})
    const created = await createVisdomsord(drafts)
    if (created === 0) throw new Error('Inga nya visdomsord att spara')

    return json({created})
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
