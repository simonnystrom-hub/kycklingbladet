import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {drawExtraImage} from '@/lib/extra-extra/draw'
import {parseExtraPreview} from '@/lib/extra-extra/payload'
import {extraPreviewResponse} from '@/lib/extra-extra/preview-body'
import {briefFromPreview} from '@/lib/extra-extra/regenerate'

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

    const brief = briefFromPreview(preview, payload.shotType)
    if (!brief) {
      return json({preview, image: null, imageError: 'Saknar bildunderlag'})
    }

    const draw = await drawExtraImage(brief)
    return json(
      extraPreviewResponse(
        {...preview, imageShotType: brief.shotType},
        draw,
      ),
    )
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
