import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/extra-extra/auth', () => ({
  extraExtraSecretOk: vi.fn(
    (request: Request) =>
      request.headers.get('x-extra-extra-secret') === 'test-secret',
  ),
  corsHeaders: () => ({'access-control-allow-origin': '*'}),
}))
vi.mock('@/lib/x/reply/persist', () => ({
  loadXReply: vi.fn(),
  loadXReplySettings: vi.fn(),
  patchXReplyDraft: vi.fn(),
}))
vi.mock('@/lib/x/reply/generate', () => ({
  generateXReply: vi.fn(),
}))

import {generateXReply} from '@/lib/x/reply/generate'
import {
  loadXReply,
  loadXReplySettings,
  patchXReplyDraft,
} from '@/lib/x/reply/persist'
import {maxDuration, OPTIONS, POST} from './route'

const pendingReply = {
  _id: 'reply-1',
  sourceTweetId: 'tweet-1',
  sourceUsername: 'anka',
  sourceText: 'Vad händer?',
  status: 'pending' as const,
  replyText: '',
  error: null,
  postedTweetId: null,
}

function request(id = 'reply-1', secret = 'test-secret') {
  return new Request('https://www.kycklingbladet.com/api/x-reply/generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-extra-extra-secret': secret,
    },
    body: JSON.stringify({id}),
  })
}

describe('X reply generate API', () => {
  beforeEach(() => {
    vi.mocked(loadXReply).mockReset()
    vi.mocked(loadXReplySettings).mockReset()
    vi.mocked(generateXReply).mockReset()
    vi.mocked(patchXReplyDraft).mockReset()
  })

  it('exports OPTIONS and a 60s duration budget', () => {
    expect(OPTIONS().status).toBe(204)
    expect(maxDuration).toBe(60)
  })

  it('rejects unauthorized requests', async () => {
    const response = await POST(request('reply-1', 'wrong-secret'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({error: 'Ej behörig'})
    expect(loadXReply).not.toHaveBeenCalled()
  })

  it('generates and saves a pending reply draft', async () => {
    vi.mocked(loadXReply).mockResolvedValue(pendingReply)
    vi.mocked(loadXReplySettings).mockResolvedValue({
      mode: 'queue',
      dumhet: 37,
      uppskruvning: 64,
      sinceId: null,
    })
    vi.mocked(generateXReply).mockResolvedValue({
      text: 'Ett nytt svar',
      promptVersion: 'prompt-v2',
      modelVersion: 'model-v3',
    })

    const response = await POST(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      replyText: 'Ett nytt svar',
      promptVersion: 'prompt-v2',
      modelVersion: 'model-v3',
    })
    expect(generateXReply).toHaveBeenCalledWith({
      text: 'Vad händer?',
      username: 'anka',
      dumhet: 37,
      uppskruvning: 64,
    })
    expect(patchXReplyDraft).toHaveBeenCalledWith('reply-1', {
      replyText: 'Ett nytt svar',
      promptVersion: 'prompt-v2',
      modelVersion: 'model-v3',
    })
  })

  it('rejects a reply that is not pending', async () => {
    vi.mocked(loadXReply).mockResolvedValue({...pendingReply, status: 'posted'})

    const response = await POST(request())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Svaret är inte i kön',
    })
    expect(loadXReplySettings).not.toHaveBeenCalled()
    expect(generateXReply).not.toHaveBeenCalled()
    expect(patchXReplyDraft).not.toHaveBeenCalled()
  })

  it('rejects a missing reply', async () => {
    vi.mocked(loadXReply).mockResolvedValue(null)

    const response = await POST(request())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Hittade inte svaret',
    })
  })
})
