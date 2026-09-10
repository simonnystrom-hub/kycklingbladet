import {beforeEach, describe, expect, it, vi} from 'vitest'

const {fetchNext, me, userMentionTimeline, xConfig, logXConfigShape} = vi.hoisted(() => ({
  fetchNext: vi.fn(),
  me: vi.fn(),
  userMentionTimeline: vi.fn(),
  xConfig: vi.fn(),
  logXConfigShape: vi.fn(),
}))

vi.mock('twitter-api-v2', () => ({
  TwitterApi: vi.fn().mockImplementation(() => ({
    v2: {me, userMentionTimeline},
  })),
}))

vi.mock('@/lib/x/share', () => ({
  xConfig,
  logXConfigShape,
}))

import {fetchXMentions} from './mentions'

const config = {
  appKey: 'app-key',
  appSecret: 'app-secret',
  accessToken: 'access-token',
  accessSecret: 'access-secret',
}

describe('fetchXMentions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    xConfig.mockReturnValue(config)
    me.mockResolvedValue({data: {id: 'our-user'}})
  })

  it('fetches mention pages and maps replies and usernames', async () => {
    const paginator = {
      tweets: [
        {
          id: '101',
          text: '@Kycklingbladet Hallå',
          author_id: 'other-user',
          referenced_tweets: [{type: 'replied_to', id: '77'}],
        },
      ],
      includes: {users: [{id: 'other-user', username: 'lasare'}]},
      done: false,
      fetchNext,
    }
    userMentionTimeline.mockResolvedValue(paginator)
    fetchNext.mockImplementation(async () => {
      paginator.done = true
      return paginator
    })

    await expect(fetchXMentions('99')).resolves.toEqual({
      ourUserId: 'our-user',
      mentions: [
        {
          id: '101',
          text: '@Kycklingbladet Hallå',
          authorId: 'other-user',
          authorUsername: 'lasare',
          inReplyToStatusId: '77',
        },
      ],
    })
    expect(userMentionTimeline).toHaveBeenCalledWith('our-user', {
      since_id: '99',
      max_results: 100,
      expansions: ['author_id', 'referenced_tweets.id'],
      'tweet.fields': ['text', 'author_id', 'referenced_tweets'],
      'user.fields': ['username'],
    })
    expect(fetchNext).toHaveBeenCalledOnce()
    expect(logXConfigShape).toHaveBeenCalledWith(config)
  })

  it('rejects before calling X when credentials are missing', async () => {
    xConfig.mockReturnValue(null)

    await expect(fetchXMentions()).rejects.toThrow('X-nycklar saknas')
    expect(me).not.toHaveBeenCalled()
    expect(userMentionTimeline).not.toHaveBeenCalled()
  })

  it('fetches at most five pages', async () => {
    const paginator = {
      tweets: [],
      includes: {users: []},
      done: false,
      fetchNext,
    }
    userMentionTimeline.mockResolvedValue(paginator)
    fetchNext.mockResolvedValue(paginator)

    await fetchXMentions()

    expect(fetchNext).toHaveBeenCalledTimes(4)
  })

  it('omits tweets missing fields needed for an XMention', async () => {
    userMentionTimeline.mockResolvedValue({
      tweets: [
        {id: '101', text: 'Giltig', author_id: 'u1'},
        {id: '102', text: '', author_id: 'u1'},
        {id: '103', text: 'Okänd användare', author_id: 'u2'},
      ],
      includes: {users: [{id: 'u1', username: 'lasare'}]},
      done: true,
      fetchNext,
    })

    await expect(fetchXMentions()).resolves.toEqual({
      ourUserId: 'our-user',
      mentions: [
        {
          id: '101',
          text: 'Giltig',
          authorId: 'u1',
          authorUsername: 'lasare',
          inReplyToStatusId: null,
        },
      ],
    })
  })

  it('uses a Swedish error when the X API fails', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    me.mockRejectedValue(new Error('403'))

    await expect(fetchXMentions()).rejects.toThrow('Kunde inte hämta mentions')
    expect(errorLog).toHaveBeenCalledWith('Kunde inte hämta mentions från X')
  })
})
