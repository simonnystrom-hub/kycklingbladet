import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {fetchSourceTweet, reusedSourceTweet} from '@/lib/x/citat/fetch-tweet'
import {generateCitat} from '@/lib/x/citat/generate'
import {citatKnobsFromPayload} from '@/lib/x/citat/prompt'
import {parseTweetStatusId} from '@/lib/x/citat/url'

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
    if (
      (payload.url !== undefined && typeof payload.url !== 'string') ||
      (payload.text !== undefined && typeof payload.text !== 'string')
    ) {
      throw new Error('Ogiltig förfrågan')
    }

    const sourceUrl = typeof payload.url === 'string' ? payload.url.trim() : ''
    const pastedText = typeof payload.text === 'string' ? payload.text.trim() : ''
    if (!sourceUrl && !pastedText) {
      throw new Error('Ogiltig förfrågan')
    }

    let quoteTweetId: string | null = null
    let sourceUsername: string | null = null
    let sourceText = pastedText
    let sourceError: string | null = null

    if (sourceUrl) {
      const statusId = parseTweetStatusId(sourceUrl)
      if (!statusId) {
        if (!pastedText) throw new Error('Ogiltig tweet-URL')
      } else {
        const reused = reusedSourceTweet(payload, statusId)
        if (reused) {
          quoteTweetId = reused.id
          sourceUsername = reused.username
          sourceText = reused.text
        } else {
          try {
            const source = await fetchSourceTweet(statusId)
            quoteTweetId = source.id
            sourceUsername = source.username
            sourceText = source.text
          } catch (error) {
            if (!pastedText) throw error
            sourceError = 'Kunde inte hämta tweeten'
          }
        }
      }
    }

    const knobs = citatKnobsFromPayload(payload)
    const result = await generateCitat({
      text: sourceText,
      username: sourceUsername,
      ...(knobs ?? {}),
    })

    return json({
      preview: {
        quoteTweetId,
        sourceUsername,
        sourceText,
        sourceUrl,
        ...(sourceError ? {sourceError} : {}),
        text: result.generated.text,
        promptVersion: result.promptVersion,
        modelVersion: result.modelVersion,
        imageShotType: result.generated.imageBrief?.shotType ?? '',
        imageCaption: result.generated.imageBrief?.caption ?? '',
        imagePrompt: result.generated.imageBrief?.scenePrompt ?? '',
      },
    })
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
