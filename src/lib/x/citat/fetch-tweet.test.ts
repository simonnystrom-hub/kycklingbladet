import {afterEach, describe, expect, it, vi} from 'vitest'

const {singleTweet} = vi.hoisted(() => ({
  singleTweet: vi.fn(),
}))

vi.mock('twitter-api-v2', () => ({
  TwitterApi: vi.fn().mockImplementation(() => ({
    v2: {singleTweet},
  })),
}))

import {fetchSourceTweet} from './fetch-tweet'

function stubXEnv() {
  vi.stubEnv('X_API_KEY', 'app-key')
  vi.stubEnv('X_API_SECRET', 'app-secret')
  vi.stubEnv('X_ACCESS_TOKEN', 'access-token')
  vi.stubEnv('X_ACCESS_TOKEN_SECRET', 'access-secret')
}

describe('fetchSourceTweet', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    singleTweet.mockReset()
  })

  it('fetches the tweet text and author username', async () => {
    stubXEnv()
    singleTweet.mockResolvedValue({
      data: {id: '123', text: 'Räven kommer', author_id: 'u1'},
      includes: {users: [{id: 'u1', username: 'Expressen'}]},
    })

    await expect(fetchSourceTweet('123')).resolves.toEqual({
      id: '123',
      username: 'Expressen',
      text: 'Räven kommer',
    })
    expect(singleTweet).toHaveBeenCalledWith('123', {
      expansions: ['author_id'],
      'tweet.fields': ['text', 'author_id'],
      'user.fields': ['username'],
    })
  })

  it('rejects before calling X when credentials are missing', async () => {
    vi.stubEnv('X_API_KEY', '')
    vi.stubEnv('X_API_SECRET', '')
    vi.stubEnv('X_ACCESS_TOKEN', '')
    vi.stubEnv('X_ACCESS_TOKEN_SECRET', '')
    vi.stubEnv('X_ACCESS_SECRET', '')

    await expect(fetchSourceTweet('123')).rejects.toThrow('X-nycklar saknas')
    expect(singleTweet).not.toHaveBeenCalled()
  })

  it('uses a Swedish error when the X API fails', async () => {
    stubXEnv()
    singleTweet.mockRejectedValue(new Error('403'))

    await expect(fetchSourceTweet('123')).rejects.toThrow('Kunde inte hämta tweeten')
  })

  it.each([
    {
      response: {
        data: {id: '123', text: '', author_id: 'u1'},
        includes: {users: [{id: 'u1', username: 'Expressen'}]},
      },
      missing: 'text',
    },
    {
      response: {
        data: {id: '123', text: 'Räven kommer', author_id: 'u1'},
        includes: {users: [{id: 'u2', username: 'Expressen'}]},
      },
      missing: 'username',
    },
  ])('rejects when the response is missing $missing', async ({response}) => {
    stubXEnv()
    singleTweet.mockResolvedValue(response)

    await expect(fetchSourceTweet('123')).rejects.toThrow('Kunde inte hämta tweeten')
  })
})
