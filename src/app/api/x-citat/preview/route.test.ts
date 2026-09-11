import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/extra-extra/auth', () => ({
  extraExtraSecretOk: vi.fn(() => true),
  corsHeaders: () => ({'Access-Control-Allow-Origin': '*'}),
}))
vi.mock('@/lib/x/citat/fetch-tweet', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/x/citat/fetch-tweet')>()
  return {
    ...actual,
    fetchSourceTweet: vi.fn(),
  }
})
vi.mock('@/lib/x/citat/generate', () => ({
  generateCitat: vi.fn(),
}))

import {extraExtraSecretOk} from '@/lib/extra-extra/auth'
import {fetchSourceTweet} from '@/lib/x/citat/fetch-tweet'
import {generateCitat} from '@/lib/x/citat/generate'
import {OPTIONS, POST} from './route'

const generated = {
  generated: {
    text: 'Hönsen kacklar vidare.',
    imageBrief: {
      shotType: 'incident' as const,
      caption: 'Hönor samlas utanför redaktionen.',
      scenePrompt: 'Chickens gathered outside a newsroom.',
    },
  },
  promptVersion: 'kb-x-citat-v1',
  modelVersion: 'claude-test',
}

function request(payload: unknown) {
  return new Request('https://www.kycklingbladet.com/api/x-citat/preview', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })
}

describe('X citat preview API', () => {
  beforeEach(() => {
    vi.mocked(extraExtraSecretOk).mockReset()
    vi.mocked(extraExtraSecretOk).mockReturnValue(true)
    vi.mocked(fetchSourceTweet).mockReset()
    vi.mocked(fetchSourceTweet).mockResolvedValue({
      id: '123',
      username: 'Expressen',
      text: 'Original tweet',
    })
    vi.mocked(generateCitat).mockReset()
    vi.mocked(generateCitat).mockResolvedValue(generated)
  })

  it('fetches a source tweet and previews generated copy without default knobs', async () => {
    const sourceUrl = 'https://x.com/Expressen/status/123'
    const response = await POST(request({url: sourceUrl}))

    expect(response.status).toBe(200)
    expect(fetchSourceTweet).toHaveBeenCalledWith('123')
    expect(generateCitat).toHaveBeenCalledWith({
      text: 'Original tweet',
      username: 'Expressen',
      language: 'sv',
    })
    expect(await response.json()).toEqual({
      preview: {
        quoteTweetId: '123',
        sourceUsername: 'Expressen',
        sourceText: 'Original tweet',
        sourceUrl,
        text: 'Hönsen kacklar vidare.',
        promptVersion: 'kb-x-citat-v1',
        modelVersion: 'claude-test',
        language: 'sv',
        imageShotType: 'incident',
        imageCaption: 'Hönor samlas utanför redaktionen.',
        imagePrompt: 'Chickens gathered outside a newsroom.',
      },
    })
  })

  it('reuses a cached source tweet instead of fetching', async () => {
    const sourceUrl = 'https://x.com/Expressen/status/123'
    const response = await POST(
      request({
        url: sourceUrl,
        text: 'Sparad originaltweet',
        quoteTweetId: '123',
        sourceUsername: 'Expressen',
        dumhet: 2,
        uppskruvning: 5,
      }),
    )

    expect(response.status).toBe(200)
    expect(fetchSourceTweet).not.toHaveBeenCalled()
    expect(generateCitat).toHaveBeenCalledWith({
      text: 'Sparad originaltweet',
      username: 'Expressen',
      language: 'sv',
      dumhet: 2,
      uppskruvning: 5,
    })
    expect((await response.json()).preview).toMatchObject({
      quoteTweetId: '123',
      sourceText: 'Sparad originaltweet',
      sourceUsername: 'Expressen',
    })
  })

  it('previews pasted text without fetching a tweet', async () => {
    const response = await POST(request({text: 'Klistrat kackel'}))

    expect(response.status).toBe(200)
    expect(fetchSourceTweet).not.toHaveBeenCalled()
    expect(generateCitat).toHaveBeenCalledWith({
      text: 'Klistrat kackel',
      username: null,
      language: 'sv',
    })
    expect((await response.json()).preview).toMatchObject({
      quoteTweetId: null,
      sourceUsername: null,
      sourceText: 'Klistrat kackel',
      sourceUrl: '',
    })
  })

  it('falls back to pasted text when fetching the URL fails', async () => {
    vi.mocked(fetchSourceTweet).mockRejectedValue(new Error('Kunde inte hämta tweeten'))

    const response = await POST(
      request({url: 'https://x.com/Expressen/status/123', text: 'Reservkackel'}),
    )

    expect(response.status).toBe(200)
    expect(generateCitat).toHaveBeenCalledWith({
      text: 'Reservkackel',
      username: null,
      language: 'sv',
    })
    expect((await response.json()).preview).toMatchObject({
      quoteTweetId: null,
      sourceError: 'Kunde inte hämta tweeten',
    })
  })

  it('passes explicitly supplied generation knobs', async () => {
    await POST(request({dumhet: 5, uppskruvning: 1, text: 'x'}))

    expect(generateCitat).toHaveBeenCalledWith({
      text: 'x',
      username: null,
      dumhet: 5,
      uppskruvning: 1,
      language: 'sv',
    })
  })

  it('rejects an empty body', async () => {
    const response = await POST(request({}))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'Ogiltig förfrågan'})
    expect(generateCitat).not.toHaveBeenCalled()
  })

  it('rejects unauthorized requests', async () => {
    vi.mocked(extraExtraSecretOk).mockReturnValue(false)

    const response = await POST(request({text: 'x'}))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({error: 'Ej behörig'})
    expect(generateCitat).not.toHaveBeenCalled()
  })

  it('returns a fetch error when no pasted fallback exists', async () => {
    vi.mocked(fetchSourceTweet).mockRejectedValue(new Error('Kunde inte hämta tweeten'))

    const response = await POST(request({url: 'https://x.com/Expressen/status/123'}))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({error: 'Kunde inte hämta tweeten'})
  })

  it('rejects an invalid tweet URL unless pasted text exists', async () => {
    const invalid = await POST(request({url: 'https://example.com/status/123'}))
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toEqual({error: 'Ogiltig tweet-URL'})

    const fallback = await POST(
      request({url: 'https://example.com/status/123', text: 'Reservtext'}),
    )
    expect(fallback.status).toBe(200)
    expect(generateCitat).toHaveBeenLastCalledWith({
      text: 'Reservtext',
      username: null,
      language: 'sv',
    })
  })

  it('maps a null image brief to empty preview strings', async () => {
    vi.mocked(generateCitat).mockResolvedValue({
      ...generated,
      generated: {text: generated.generated.text, imageBrief: null},
    })

    const response = await POST(request({text: 'x'}))

    expect((await response.json()).preview).toMatchObject({
      imageShotType: '',
      imageCaption: '',
      imagePrompt: '',
    })
  })

  it('detects English source copy and returns language en', async () => {
    vi.mocked(fetchSourceTweet).mockResolvedValue({
      id: '123',
      username: 'BBC',
      text: 'The government announced a new tax today',
    })

    const response = await POST(request({url: 'https://x.com/BBC/status/123'}))

    expect(response.status).toBe(200)
    expect(generateCitat).toHaveBeenCalledWith({
      text: 'The government announced a new tax today',
      username: 'BBC',
      language: 'en',
    })
    expect((await response.json()).preview).toMatchObject({language: 'en'})
  })

  it('lets an explicit language override win', async () => {
    const response = await POST(
      request({
        text: 'The government announced a new tax today',
        language: 'sv',
      }),
    )

    expect(generateCitat).toHaveBeenCalledWith({
      text: 'The government announced a new tax today',
      username: null,
      language: 'sv',
    })
    expect((await response.json()).preview).toMatchObject({language: 'sv'})
  })

  it('answers CORS preflight requests', async () => {
    const response = OPTIONS()

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
