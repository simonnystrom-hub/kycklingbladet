import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {parseExtraPreview} from '@/lib/extra-extra/payload'
import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import {getWriteClient} from '@/lib/sanity/write-client'

type StoredAlarm = {_id: string; date: string}

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
    if (typeof payload.alarmId !== 'string' || !preview) {
      throw new Error('Ogiltig förfrågan')
    }

    const id = payload.alarmId.replace(/^drafts\./, '')
    const alarm = await getWriteClient().fetch<StoredAlarm | null>(
      '*[_id in [$id, $draftId]][0]{_id, date}',
      {id, draftId: `drafts.${id}`},
    )
    if (!alarm) return json({error: 'Inget larm'}, 404)

    await getWriteClient()
      .patch(alarm._id.replace(/^drafts\./, ''))
      .set({
        extraExtra: {
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
        },
      })
      .commit()

    return json({ok: true})
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
