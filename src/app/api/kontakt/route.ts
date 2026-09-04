import {getWriteClient} from '@/lib/sanity/write-client'
import {NextResponse} from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_MESSAGE = 4000

function asTrimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({error: 'Ogiltig förfrågan'}, {status: 400})
  }

  if (asTrimmed(payload.website)) {
    return NextResponse.json({ok: true})
  }

  const name = asTrimmed(payload.name)
  const email = asTrimmed(payload.email).toLowerCase()
  const message = asTrimmed(payload.message)

  if (!name || name.length > 120) {
    return NextResponse.json({error: 'Ange ett namn'}, {status: 400})
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({error: 'Ange en giltig e-postadress'}, {status: 400})
  }
  if (!message || message.length > MAX_MESSAGE) {
    return NextResponse.json({error: 'Skriv ett meddelande'}, {status: 400})
  }

  try {
    await getWriteClient().create({
      _type: 'contactMessage',
      name,
      email,
      message,
      receivedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({error: 'Kunde inte spara meddelandet'}, {status: 500})
  }

  return NextResponse.json({ok: true})
}
