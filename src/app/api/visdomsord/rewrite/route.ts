import {NextResponse} from 'next/server'
import {corsHeaders, extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {rewriteVisdomsord} from '@/lib/visdomsord/persist'

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

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return json({error: 'Ogiltig förfrågan'}, 400)
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return json({error: 'Ogiltig förfrågan'}, 400)
  }

  const ids = (input as Record<string, unknown>).ids
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
    return json({error: 'Ogiltig förfrågan'}, 400)
  }

  try {
    return json(await rewriteVisdomsord(ids))
  } catch (error) {
    return json(
      {error: error instanceof Error ? error.message : 'Ogiltig förfrågan'},
      400,
    )
  }
}
