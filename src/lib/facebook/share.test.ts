import {afterEach, describe, expect, it, vi} from 'vitest'
import {FACEBOOK_GRAPH_BASE, shareToFacebook} from './share'

const articleUrl = 'https://www.kycklingbladet.com/arkiv/2026-09-05'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  })
}

describe('shareToFacebook', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('unwraps quoted page id and token', async () => {
    vi.stubEnv('FACEBOOK_PAGE_ID', '"page-1"')
    vi.stubEnv('FACEBOOK_PAGE_ACCESS_TOKEN', "'token-1'")
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, {id: 'page-1_post'}))
      .mockResolvedValueOnce(jsonResponse(200, {id: 'comment-1'}))
    vi.stubGlobal('fetch', fetchMock)

    await expect(shareToFacebook({message: 'Rubrik', articleUrl})).resolves.toBe('shared')

    expect(String(fetchMock.mock.calls[0][1].body)).toContain('access_token=token-1')
    expect(fetchMock.mock.calls[0][0]).toBe(`${FACEBOOK_GRAPH_BASE}/page-1/feed`)
  })

  it('does not fetch when env is missing', async () => {
    vi.stubEnv('FACEBOOK_PAGE_ID', '')
    vi.stubEnv('FACEBOOK_PAGE_ACCESS_TOKEN', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      shareToFacebook({
        message: 'Rubrik',
        articleUrl,
        imageUrl: 'https://cdn.sanity.io/x.jpg',
      }),
    ).resolves.toBe('skipped')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalled()
  })

  it('posts a photo then comments the article URL', async () => {
    vi.stubEnv('FACEBOOK_PAGE_ID', 'page-1')
    vi.stubEnv('FACEBOOK_PAGE_ACCESS_TOKEN', 'token-1')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, {id: 'photo-9', post_id: 'page-1_photo-9'}))
      .mockResolvedValueOnce(jsonResponse(200, {id: 'comment-1'}))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      shareToFacebook({
        message: 'Rubrik\n\nSe länk i kommentar',
        articleUrl,
        imageUrl: 'https://cdn.sanity.io/x.jpg',
      }),
    ).resolves.toBe('shared')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe(`${FACEBOOK_GRAPH_BASE}/page-1/photos`)
    const photoBody = String(fetchMock.mock.calls[0][1].body)
    expect(photoBody).toContain('url=https%3A%2F%2Fcdn.sanity.io%2Fx.jpg')
    expect(photoBody).toContain('caption=Rubrik')
    expect(photoBody).toContain('access_token=token-1')
    expect(fetchMock.mock.calls[1][0]).toBe(`${FACEBOOK_GRAPH_BASE}/page-1_photo-9/comments`)
    expect(String(fetchMock.mock.calls[1][1].body)).toContain(
      `message=${encodeURIComponent(articleUrl)}`,
    )
  })

  it('posts to feed when there is no image', async () => {
    vi.stubEnv('FACEBOOK_PAGE_ID', 'page-1')
    vi.stubEnv('FACEBOOK_PAGE_ACCESS_TOKEN', 'token-1')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, {id: 'page-1_post'}))
      .mockResolvedValueOnce(jsonResponse(200, {id: 'comment-1'}))
    vi.stubGlobal('fetch', fetchMock)

    await expect(shareToFacebook({message: 'Rubrik', articleUrl})).resolves.toBe('shared')

    expect(fetchMock.mock.calls[0][0]).toBe(`${FACEBOOK_GRAPH_BASE}/page-1/feed`)
    expect(String(fetchMock.mock.calls[0][1].body)).toContain('message=Rubrik')
  })

  it('does not throw when Graph returns an error', async () => {
    vi.stubEnv('FACEBOOK_PAGE_ID', 'page-1')
    vi.stubEnv('FACEBOOK_PAGE_ACCESS_TOKEN', 'token-1')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(400, {error: {message: 'fail'}})))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(shareToFacebook({message: 'Rubrik', articleUrl})).resolves.toBe('failed')
  })
})
