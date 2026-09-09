import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {parseExtraPreviewImage} from '@/lib/extra-extra/payload'
import {appendMentions, normalizeMentions} from '@/lib/x/citat/mentions'
import {shareToX} from '@/lib/x/share'

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
    const preview = payload.preview
    if (!preview || typeof preview !== 'object' || Array.isArray(preview)) {
      throw new Error('Ogiltig förfrågan')
    }

    const value = preview as Record<string, unknown>
    if (typeof value.text !== 'string' || !value.text.trim()) {
      throw new Error('Ogiltig förfrågan')
    }

    if (typeof value.quoteTweetId !== 'string' || !value.quoteTweetId.trim()) {
      throw new Error('Saknar tweet att citera')
    }

    const image = parseExtraPreviewImage(payload.image)
    if (!image) {
      throw new Error('Saknar bild')
    }

    const sourceUsername =
      typeof value.sourceUsername === 'string' ? value.sourceUsername : undefined
    const mentions = typeof payload.mentions === 'string' ? payload.mentions : ''
    const text = appendMentions(
      value.text,
      normalizeMentions(mentions, sourceUsername),
    )
    const result = await shareToX({
      text,
      imageBase64: image.base64,
      quoteTweetId: value.quoteTweetId.trim(),
    })

    if (result === 'skipped') {
      throw new Error('X-nycklar saknas')
    }
    if (result === 'failed') {
      throw new Error('Kunde inte posta till X')
    }

    return json({ok: true})
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
