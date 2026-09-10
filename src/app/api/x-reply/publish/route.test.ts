import {beforeEach, describe, expect, it, vi} from 'vitest'

const facebookModuleLoaded = vi.hoisted(() => vi.fn())

vi.mock('@/lib/extra-extra/auth', () => ({
  extraExtraSecretOk: vi.fn(
    (request: Request) =>
      request.headers.get('x-extra-extra-secret') === 'test-secret',
  ),
  corsHeaders: () => ({'access-control-allow-origin': '*'}),
}))
vi.mock('@/lib/x/reply/publish', () => ({
  publishXReply: vi.fn(),
}))
vi.mock('@/lib/facebook/published', () => {
  facebookModuleLoaded()
  return {sharePublishedExtra: vi.fn()}
})

import {publishXReply} from '@/lib/x/reply/publish'
import {maxDuration, OPTIONS, POST} from './route'

function request(id = 'reply-1', secret = 'test-secret') {
  return new Request('https://www.kycklingbladet.com/api/x-reply/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-extra-extra-secret': secret,
    },
    body: JSON.stringify({id}),
  })
}

describe('X reply publish API', () => {
  beforeEach(() => {
    vi.mocked(publishXReply).mockReset()
  })

  it('exports OPTIONS and a 60s duration budget', () => {
    expect(OPTIONS().status).toBe(204)
    expect(maxDuration).toBe(60)
  })

  it('rejects unauthorized requests', async () => {
    const response = await POST(request('reply-1', 'wrong-secret'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({error: 'Ej behörig'})
    expect(publishXReply).not.toHaveBeenCalled()
  })

  it('publishes an X reply and returns its tweet id', async () => {
    vi.mocked(publishXReply).mockResolvedValue({postedTweetId: 'posted-123'})

    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      postedTweetId: 'posted-123',
    })
    expect(publishXReply).toHaveBeenCalledWith('reply-1')
    expect(facebookModuleLoaded).not.toHaveBeenCalled()
  })
})
