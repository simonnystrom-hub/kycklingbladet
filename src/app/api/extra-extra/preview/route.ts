import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {cachedArticleHeadline, scrapeArticleHeadline} from '@/lib/extra-extra/scrape'
import {generateExtra} from '@/lib/generate/claude-extra'
import {EXTRA_KICKER, parseExtraWriteKnobs} from '@/lib/generate/extra-prompt'
import {resolveNewspaper} from '@/lib/extra-extra/papers'
import {xHashtagLine} from '@/lib/x/hashtags'

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
    if (typeof payload.url !== 'string') {
      throw new Error('Ogiltig förfrågan')
    }

    const paper = resolveNewspaper(payload.url)
    if (!paper) throw new Error('Ogiltig länk')

    const cachedHeadline = cachedArticleHeadline(payload)
    const source = cachedHeadline
      ? {headline: cachedHeadline, paper}
      : await scrapeArticleHeadline(payload.url)
    const knobs = parseExtraWriteKnobs(payload)
    const result = await generateExtra({
      text: source.headline,
      newspaperName: source.paper.name,
      ...knobs,
    })

    const preview = {
      kicker: EXTRA_KICKER,
      headline: result.generated.headline,
      body: result.generated.body,
      sourceUrl: payload.url,
      sourceHeadline: source.headline,
      sourceNewspaper: source.paper.name,
      sourceNewspaperSlug: source.paper.slug,
      promptVersion: result.promptVersion,
      modelVersion: result.modelVersion,
      imageShotType: result.generated.imageBrief?.shotType ?? '',
      imageCaption: result.generated.imageBrief?.caption ?? '',
      imagePrompt: result.generated.imageBrief?.scenePrompt ?? '',
      xHashtags: xHashtagLine(result.generated.hashtags),
    }
    return json({preview})
  } catch (error) {
    return json({error: error instanceof Error ? error.message : 'Ogiltig förfrågan'}, 400)
  }
}
