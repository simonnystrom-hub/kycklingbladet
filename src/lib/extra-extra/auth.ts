import {timingSafeEqual} from 'node:crypto'

export function extraExtraSecretOk(request: Request): boolean {
  const expected = process.env.EXTRA_EXTRA_SECRET
  const supplied = request.headers.get('x-extra-extra-secret')
  if (!expected || !supplied) return false

  const expectedBuffer = Buffer.from(expected)
  const suppliedBuffer = Buffer.from(supplied)
  if (expectedBuffer.length !== suppliedBuffer.length) return false

  return timingSafeEqual(expectedBuffer, suppliedBuffer)
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-extra-extra-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
