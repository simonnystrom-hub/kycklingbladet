import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {parseExtraPreviewImage} from '@/lib/extra-extra/payload'
import {normalizeMentions} from '@/lib/x/citat/mentions'
import {citatFollowUpText, citatParentText, parseTweetUsername} from '@/lib/x/citat/url'
import {resolveXCopyLanguage} from '@/lib/x/language'
import {shareToXDetailed} from '@/lib/x/share'

export const maxDuration = 60

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {status, headers: corsHeaders()})
}

export function OPTIONS() {
  return new Response(null, {status: 204, headers: corsHeaders()})
}

function postedOrThrow(
  posted: {result: 'shared' | 'skipped' | 'failed'; error?: string},
  failedPrefix: string,
) {
  if (posted.result === 'skipped') {
    throw new Error('X-nycklar saknas')
  }
  if (posted.result === 'failed') {
    throw new Error(posted.error ? `${failedPrefix}: ${posted.error}` : failedPrefix)
  }
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

    const sourceUrl = typeof value.sourceUrl === 'string' ? value.sourceUrl.trim() : ''
    const sourceUsername =
      parseTweetUsername(sourceUrl) ??
      (typeof value.sourceUsername === 'string' ? value.sourceUsername : undefined)
    const extraMentions = normalizeMentions(
      typeof payload.mentions === 'string' ? payload.mentions : '',
      sourceUsername,
    )
    const language = resolveXCopyLanguage({
      text: value.text,
      language: payload.language ?? value.language,
    })
    const followUp = sourceUrl ? citatFollowUpText(sourceUrl, extraMentions, language) : null
    if (sourceUrl && !followUp) {
      throw new Error('Ogiltig tweet-URL')
    }

    const image = parseExtraPreviewImage(payload.image)
    if (!image) {
      throw new Error('Saknar bild')
    }

    const hashtags = typeof payload.xHashtags === 'string' ? payload.xHashtags : value.xHashtags
    const text = citatParentText(value.text, sourceUrl, language, hashtags)
    const parent = await shareToXDetailed({
      text,
      imageBase64: image.base64,
    })
    postedOrThrow(parent, 'Kunde inte posta till X')

    if (followUp && parent.tweetId) {
      const reply = await shareToXDetailed({
        text: followUp,
        inReplyToTweetId: parent.tweetId,
      })
      if (reply.result !== 'shared') {
        throw new Error(
          reply.error
            ? `Hönstweeten gick ut men uppföljningen misslyckades: ${reply.error}`
            : 'Hönstweeten gick ut men uppföljningen misslyckades',
        )
      }
    }

    return json({ok: true})
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
