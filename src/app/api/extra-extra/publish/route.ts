import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {extraExtraId, nextExtraExtraSlot} from '@/lib/extra-extra/id'
import {parseExtraPreview, parseExtraPreviewImage} from '@/lib/extra-extra/payload'
import {extraCreateDocument, type ExtraPublishAsset} from '@/lib/extra-extra/publish-doc'
import {sharePublishedExtra} from '@/lib/facebook/published'
import {xHashtagLine} from '@/lib/x/hashtags'
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
    const client = getWriteClient()
    const existingIds = await client.fetch<string[]>(
      '*[_type == "extraExtra" && date == $date]._id',
      {date},
    )
    const slot = nextExtraExtraSlot(existingIds ?? [], date)
    const id = extraExtraId(date, slot)

    const image = parseExtraPreviewImage(payload.image)
    let asset: ExtraPublishAsset | null = null
    let imageUrl: string | null = null
    if (image) {
      const uploaded = await client.assets.upload(
        'image',
        Buffer.from(image.base64, 'base64'),
        {filename: `extra-extra-${date}-${slot}.jpg`, contentType: image.mimeType},
      )
      asset = {_id: uploaded._id}
      imageUrl = typeof uploaded.url === 'string' ? uploaded.url : null
    }

    await client.create(
      extraCreateDocument({
        id,
        date,
        preview,
        asset,
        createdAt: new Date().toISOString(),
      }),
    )

    await sharePublishedExtra(date, {
      id,
      headline: preview.headline,
      body: preview.body,
      imageCaption: preview.imageCaption,
      imageUrl,
      xHashtags: xHashtagLine(preview.xHashtags),
    })

    return json({ok: true})
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
