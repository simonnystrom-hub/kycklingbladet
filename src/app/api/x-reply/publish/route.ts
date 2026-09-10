import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {publishXReply} from '@/lib/x/reply/publish'

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

    const {postedTweetId} = await publishXReply(
      (input as {id: string}).id,
    )
    return json({ok: true, postedTweetId})
  } catch (error) {
    return json(
      {error: error instanceof Error ? error.message : 'Ogiltig förfrågan'},
      400,
    )
  }
}
