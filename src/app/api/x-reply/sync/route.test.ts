import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/extra-extra/auth', () => ({
  extraExtraSecretOk: vi.fn(
    (request: Request) =>
      request.headers.get('x-extra-extra-secret') === 'test-secret',
  ),
  corsHeaders: () => ({'access-control-allow-origin': '*'}),
}))
vi.mock('@/lib/x/reply/ingest', () => ({
  runXReply: vi.fn(),
}))

import {runXReply} from '@/lib/x/reply/ingest'
import {maxDuration, OPTIONS, POST} from './route'

function request(secret = 'test-secret') {
  return new Request('https://www.kycklingbladet.com/api/x-reply/sync', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-extra-extra-secret': secret,
    },
    body: '{}',
  })
}

describe('X reply sync API', () => {
  beforeEach(() => {
    vi.mocked(runXReply).mockReset()
  })

  it('exports OPTIONS and a 60s duration budget', () => {
    expect(OPTIONS().status).toBe(204)
    expect(maxDuration).toBe(60)
  })

  it('rejects unauthorized requests', async () => {
    const response = await POST(request('wrong-secret'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({error: 'Ej behörig'})
    expect(runXReply).not.toHaveBeenCalled()
  })

  it('runs mention sync and returns its counts', async () => {
    vi.mocked(runXReply).mockResolvedValue({
      ingested: 3,
      posted: 1,
      skipped: 2,
    })

    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ingested: 3,
      posted: 1,
      skipped: 2,
    })
    expect(runXReply).toHaveBeenCalledOnce()
  })

  it('returns fetch errors as bad requests', async () => {
    vi.mocked(runXReply).mockRejectedValue(new Error('Kunde inte hämta omnämnanden'))

    const response = await POST(request())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Kunde inte hämta omnämnanden',
    })
  })
})
