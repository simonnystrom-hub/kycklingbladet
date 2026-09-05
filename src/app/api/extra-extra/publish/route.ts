import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {extraExtraId} from '@/lib/extra-extra/id'
import {parseExtraPreview} from '@/lib/extra-extra/payload'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import {getWriteClient} from '@/lib/sanity/write-client'
import {stockholmToday} from '@/lib/select/stockholm-date'

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
    const payload = input as Record<string, unknown>
    const preview = parseExtraPreview(payload.preview)
    if (!preview) {
      throw new Error('Ogiltig förfrågan')
    }

    const date = stockholmToday()
    const id = extraExtraId(date)
    const client = getWriteClient()
    const existing = await client.fetch<string | null>('*[_id == $id][0]._id', {id})
    if (existing) {
      return json({error: 'Ta bort den befintliga EXTRA EXTRA först'}, 409)
    }

    await client.create({
      _id: id,
      _type: 'extraExtra',
      date,
      kicker: EXTRA_KICKER,
      headline: preview.headline,
      body: preview.body,
      sourceUrl: preview.sourceUrl,
      sourceHeadline: preview.sourceHeadline,
      sourceNewspaper: preview.sourceNewspaper,
      sourceNewspaperSlug: preview.sourceNewspaperSlug,
      promptVersion: preview.promptVersion,
      modelVersion: preview.modelVersion,
      createdAt: new Date().toISOString(),
    })

    return json({ok: true})
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
