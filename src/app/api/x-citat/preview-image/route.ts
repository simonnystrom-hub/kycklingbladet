import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {drawExtraImage} from '@/lib/extra-extra/draw'
import {validateExtraImageBrief} from '@/lib/generate/extra-image'
import {generateCitatSpeechBubble} from '@/lib/x/citat/generate'
import {parseCitatSourceImage, parseManualSpeechBubble} from '@/lib/x/citat/source-image'
import {resolveXCopyLanguage} from '@/lib/x/language'

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

    const payload = input as Record<string, unknown>
    const preview = payload.preview
    if (!preview || typeof preview !== 'object' || Array.isArray(preview)) {
      throw new Error('Ogiltig förfrågan')
    }

    const brief = validateExtraImageBrief(preview)
    if (!brief) {
      return json({preview, image: null, imageError: 'Saknar bildunderlag', speechBubble: null})
    }

    const sourceImage =
      payload.sourceImage === undefined ? null : parseCitatSourceImage(payload.sourceImage)
    if (payload.sourceImage !== undefined && !sourceImage) {
      throw new Error('Ogiltig förlaga')
    }

    const previewRecord = preview as Record<string, unknown>
    const henText = typeof previewRecord.text === 'string' ? previewRecord.text : ''
    const language = resolveXCopyLanguage({
      text: henText,
      language: payload.language ?? previewRecord.language,
    })
    const typedBubble = parseManualSpeechBubble(payload.speechBubbleText)
    const wantBubble = payload.speechBubble === true || Boolean(typedBubble)

    let speechBubble: string | null = typedBubble
    if (wantBubble && !speechBubble) {
      try {
        speechBubble = await generateCitatSpeechBubble({text: henText, language})
      } catch (error) {
        return json({
          preview,
          image: null,
          imageError: error instanceof Error ? error.message : 'Kunde inte skriva pratbubblan',
          speechBubble: null,
        })
      }
    }

    const draw = await drawExtraImage(brief, {
      ...(speechBubble ? {speechBubble} : {}),
      ...(sourceImage ? {sourceImage} : {}),
      balloonLanguage: language,
    })
    return json({preview, ...draw, speechBubble})
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
