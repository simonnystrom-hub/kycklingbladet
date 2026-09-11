import {beforeEach, describe, expect, it, vi} from 'vitest'
import {
  createPendingXReply,
  deleteOldXReplies,
  listPendingReady,
  loadXReply,
  loadXReplyIndex,
  loadXReplySettings,
  patchXReplyDraft,
  patchXReplyError,
  patchXReplyPosted,
  saveXMentionsSinceId,
  xReplyMaxAgeCutoff,
} from './persist'

const {create, fetch, patch, del} = vi.hoisted(() => ({
  create: vi.fn(),
  fetch: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}))

vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: () => ({create, fetch, patch, delete: del}),
}))

function patchChain() {
  const commit = vi.fn().mockResolvedValue(undefined)
  const set = vi.fn(() => ({commit}))
  return {commit, set}
}

describe('X reply persistence', () => {
  beforeEach(() => {
    create.mockReset()
    fetch.mockReset()
    patch.mockReset()
    del.mockReset()
  })

  it('loads safe defaults when site settings are missing', async () => {
    fetch.mockResolvedValue(null)

    await expect(loadXReplySettings()).resolves.toEqual({
      mode: 'queue',
      dumhet: 5,
      uppskruvning: 5,
      sinceId: null,
    })
    expect(fetch).toHaveBeenCalledWith(
      '*[_id == "siteSettings"][0]{xReplyMode, xReplyDumhet, xReplyUppskruvning, xMentionsSinceId}',
    )
  })

  it('accepts only exact auto mode and parses knobs', async () => {
    fetch
      .mockResolvedValueOnce({
        xReplyMode: 'auto',
        xReplyDumhet: '5',
        xReplyUppskruvning: 1,
        xMentionsSinceId: '123',
      })
      .mockResolvedValueOnce({
        xReplyMode: 'AUTO',
        xReplyDumhet: 0,
        xReplyUppskruvning: null,
        xMentionsSinceId: '',
      })

    await expect(loadXReplySettings()).resolves.toEqual({
      mode: 'auto',
      dumhet: 5,
      uppskruvning: 1,
      sinceId: '123',
    })
    await expect(loadXReplySettings()).resolves.toEqual({
      mode: 'queue',
      dumhet: 5,
      uppskruvning: 5,
      sinceId: null,
    })
  })

  it('treats the old 3/3 knob pair as Galen and max', async () => {
    fetch.mockResolvedValue({
      xReplyMode: 'queue',
      xReplyDumhet: 3,
      xReplyUppskruvning: 3,
      xMentionsSinceId: '9',
    })

    await expect(loadXReplySettings()).resolves.toEqual({
      mode: 'queue',
      dumhet: 5,
      uppskruvning: 5,
      sinceId: '9',
    })
  })

  it('loads source and non-empty posted tweet ids', async () => {
    fetch.mockResolvedValue([
      {sourceTweetId: 'source-1', postedTweetId: 'posted-1'},
      {sourceTweetId: 'source-2', postedTweetId: ''},
      {sourceTweetId: 'source-3', postedTweetId: null},
    ])

    const result = await loadXReplyIndex()

    expect(result.existingSourceIds).toEqual(
      new Set(['source-1', 'source-2', 'source-3']),
    )
    expect(result.ourPostedIds).toEqual(new Set(['posted-1']))
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "xReply" && !(_id in path("drafts.**"))]{sourceTweetId, postedTweetId}',
    )
  })

  it('creates a pending reply and returns its id', async () => {
    const input = {
      sourceTweetId: 'source-1',
      sourceUsername: 'honskontot',
      sourceText: 'Original tweet',
      sourceUrl: 'https://x.com/honskontot/status/source-1',
      replyText: 'Svar',
      error: '',
      promptVersion: 'prompt-v1',
      modelVersion: 'model-v1',
    }
    create.mockResolvedValue({_id: 'reply-1'})

    await expect(createPendingXReply(input)).resolves.toBe('reply-1')
    expect(create).toHaveBeenCalledWith({
      _type: 'xReply',
      status: 'pending',
      ...input,
    })
  })

  it('saves the latest mention id on site settings', async () => {
    const chain = patchChain()
    patch.mockReturnValue(chain)

    await saveXMentionsSinceId('456')

    expect(patch).toHaveBeenCalledWith('siteSettings')
    expect(chain.set).toHaveBeenCalledWith({xMentionsSinceId: '456'})
    expect(chain.commit).toHaveBeenCalled()
  })

  it('lists pending replies ready to post', async () => {
    const rows = [
      {
        _id: 'reply-1',
        sourceTweetId: 'source-1',
        sourceUsername: 'honskontot',
        sourceText: 'Original tweet',
        status: 'pending',
        replyText: 'Svar',
        error: null,
        postedTweetId: null,
      },
    ]
    fetch.mockResolvedValue(rows)

    await expect(listPendingReady(5)).resolves.toEqual(rows)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('status == "pending"'),
      {limit: 5},
    )
    const query = fetch.mock.calls[0][0] as string
    expect(query).toContain('replyText != ""')
    expect(query).toContain('!defined(error) || error == ""')
    expect(query).toContain('dateTime(_createdAt) > dateTime(now()) - 60 * 60 * 24 * 30')
    expect(query).toContain('order(_createdAt asc)[0...$limit]')
  })

  it('deletes x-replies older than 30 days', async () => {
    fetch.mockResolvedValue(['old-1', 'old-2'])
    del.mockResolvedValue(undefined)

    await expect(
      deleteOldXReplies(new Date('2026-09-11T08:00:00.000Z')),
    ).resolves.toBe(2)

    expect(xReplyMaxAgeCutoff(new Date('2026-09-11T08:00:00.000Z'))).toBe(
      '2026-08-12T08:00:00.000Z',
    )
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "xReply" && dateTime(_createdAt) < dateTime($cutoff)]._id',
      {cutoff: '2026-08-12T08:00:00.000Z'},
    )
    expect(del).toHaveBeenNthCalledWith(1, 'old-1')
    expect(del).toHaveBeenNthCalledWith(2, 'old-2')
  })

  it('does not delete when nothing is older than a month', async () => {
    fetch.mockResolvedValue([])

    await expect(deleteOldXReplies()).resolves.toBe(0)
    expect(del).not.toHaveBeenCalled()
  })

  it('patches posted, error, and successful draft states', async () => {
    const posted = patchChain()
    const errored = patchChain()
    const drafted = patchChain()
    patch
      .mockReturnValueOnce(posted)
      .mockReturnValueOnce(errored)
      .mockReturnValueOnce(drafted)

    await patchXReplyPosted('reply-1', 'posted-1')
    await patchXReplyError('reply-2', 'X failed')
    await patchXReplyDraft('reply-3', {
      replyText: 'Nytt svar',
      promptVersion: 'prompt-v2',
      modelVersion: 'model-v2',
    })

    expect(posted.set).toHaveBeenCalledWith({
      status: 'posted',
      postedTweetId: 'posted-1',
    })
    expect(errored.set).toHaveBeenCalledWith({error: 'X failed'})
    expect(drafted.set).toHaveBeenCalledWith({
      replyText: 'Nytt svar',
      promptVersion: 'prompt-v2',
      modelVersion: 'model-v2',
      error: '',
    })
  })

  it('loads a reply with source context', async () => {
    const row = {
      _id: 'reply-1',
      sourceTweetId: 'source-1',
      sourceUsername: 'honskontot',
      sourceText: 'Original tweet',
      status: 'pending',
      replyText: 'Svar',
      error: null,
      postedTweetId: null,
    }
    fetch.mockResolvedValue(row)

    await expect(loadXReply('reply-1')).resolves.toEqual(row)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('sourceUsername, sourceText'),
      {id: 'reply-1'},
    )
  })
})
