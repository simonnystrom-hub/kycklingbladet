import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {scrapeArticleHeadline} from '@/lib/extra-extra/scrape'
import {generateExtra} from '@/lib/generate/claude-extra'
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
    if (typeof payload.alarmId !== 'string' || typeof payload.url !== 'string') {
      throw new Error('Ogiltig förfrågan')
    }

    const id = payload.alarmId.replace(/^drafts\./, '')
    const alarm = await getWriteClient().fetch<StoredAlarm | null>(
      '*[_id in [$id, $draftId]][0]{_id, date}',
      {id, draftId: `drafts.${id}`},
    )
    if (!alarm) return json({error: 'Inget larm'}, 404)

    const source = await scrapeArticleHeadline(payload.url)
    const result = await generateExtra({
      text: source.headline,
      newspaperName: source.paper.name,
    })

    return json({
      preview: {
        kicker: EXTRA_KICKER,
        headline: result.generated.headline,
        body: result.generated.body,
        sourceUrl: payload.url,
        sourceHeadline: source.headline,
        sourceNewspaper: source.paper.name,
        sourceNewspaperSlug: source.paper.slug,
        promptVersion: result.promptVersion,
        modelVersion: result.modelVersion,
      },
    })
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
