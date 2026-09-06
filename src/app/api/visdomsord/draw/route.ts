import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {generateImageBriefFromCopy} from '@/lib/generate/image-brief'
import {attachLeadImage} from '@/lib/lead/attach-image'
import {getWriteClient} from '@/lib/sanity/write-client'
import {stockholmToday} from '@/lib/select/stockholm-date'

export const maxDuration = 60

type Visdomsord = {
  _id: string
  quote: string
  henName: string
}

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

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return json({error: 'Ogiltig förfrågan'}, 400)
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return json({error: 'Ogiltig förfrågan'}, 400)
  }

  const ids = (input as Record<string, unknown>).ids
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
    return json({error: 'Ogiltig förfrågan'}, 400)
  }

  try {
    const rows = await getWriteClient().fetch<Visdomsord[]>(
      `*[
        _type == "visdomsord" &&
        _id in $ids &&
        !defined(usedDate) &&
        !defined(image.asset)
      ]{_id, quote, henName}`,
      {ids},
    )
    const byId = new Map(rows.map((row) => [row._id, row]))
    const results: {id: string; imageError: string | null}[] = []

    for (const id of ids) {
      const row = byId.get(id)
      if (!row) continue

      try {
        const brief = await generateImageBriefFromCopy({
          kind: 'visdomsord',
          headline: row.henName,
          body: row.quote,
        })
        const draw = await attachLeadImage({
          id,
          date: stockholmToday(),
          brief,
          filename: `visdomsord-${id}.jpg`,
        })
        results.push({id, imageError: draw.imageError})
      } catch (error) {
        results.push({
          id,
          imageError: error instanceof Error ? error.message : 'Kunde inte skapa bild',
        })
      }
    }

    return json({results})
  } catch (error) {
    return json(
      {error: error instanceof Error ? error.message : 'Ogiltig förfrågan'},
      400,
    )
  }
}
