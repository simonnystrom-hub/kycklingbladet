import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {generateXReply} from '@/lib/x/reply/generate'
import {
  loadXReply,
  loadXReplySettings,
  patchXReplyDraft,
} from '@/lib/x/reply/persist'

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
    if (
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input) ||
      typeof (input as Record<string, unknown>).id !== 'string'
    ) {
      throw new Error('Ogiltig förfrågan')
    }

    const id = (input as {id: string}).id
    const reply = await loadXReply(id)
    if (!reply) throw new Error('Hittade inte svaret')
    if (reply.status !== 'pending') throw new Error('Svaret är inte i kön')

    const settings = await loadXReplySettings()
    const generated = await generateXReply({
      text: reply.sourceText,
      username: reply.sourceUsername,
      dumhet: settings.dumhet,
      uppskruvning: settings.uppskruvning,
    })
    const draft = {
      replyText: generated.text,
      promptVersion: generated.promptVersion,
      modelVersion: generated.modelVersion,
    }
    await patchXReplyDraft(id, draft)

    return json(draft)
  } catch (error) {
    return json(
      {error: error instanceof Error ? error.message : 'Ogiltig förfrågan'},
      400,
    )
  }
}
