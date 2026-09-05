import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {parseExtraImageShotType, validateExtraImageBrief} from '@/lib/generate/extra-image'
import {attachLeadImage} from '@/lib/lead/attach-image'
import {getWriteClient} from '@/lib/sanity/write-client'

export const maxDuration = 60

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {status, headers: corsHeaders()})
}

export function OPTIONS() {
  return new Response(null, {status: 204, headers: corsHeaders()})
}

type AlarmImageDoc = {
  _id: string
  date: string
  imageCaption?: string | null
  imagePrompt?: string | null
  imageShotType?: string | null
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
    if (typeof payload.id !== 'string') {
      throw new Error('Ogiltig förfrågan')
    }

    const doc = await getWriteClient().fetch<AlarmImageDoc | null>(
      `*[_type == "alarm" && _id == $id][0]{_id, date, imageCaption, imagePrompt, imageShotType}`,
      {id: payload.id},
    )
    if (!doc) {
      throw new Error('Ogiltig förfrågan')
    }

    const brief = validateExtraImageBrief({
      imageCaption: doc.imageCaption,
      imagePrompt: doc.imagePrompt,
      imageShotType: parseExtraImageShotType(payload.shotType) ?? doc.imageShotType,
    })

    if (!brief) {
      return json({
        image: null,
        imageError: 'Saknar bildunderlag',
        imageCaption: typeof doc.imageCaption === 'string' ? doc.imageCaption : null,
        imageShotType: parseExtraImageShotType(doc.imageShotType) ?? null,
      })
    }

    const result = await attachLeadImage({id: doc._id, date: doc.date, brief})
    return json({
      image: result.image,
      imageError: result.imageError,
      imageCaption: brief.caption,
      imageShotType: brief.shotType,
    })
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
