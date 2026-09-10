import {beforeEach, describe, expect, it, vi} from 'vitest'

const {
  loadXReply,
  patchXReplyError,
  patchXReplyPosted,
  shareToXDetailed,
} = vi.hoisted(() => ({
  loadXReply: vi.fn(),
  patchXReplyError: vi.fn(),
  patchXReplyPosted: vi.fn(),
  shareToXDetailed: vi.fn(),
}))

vi.mock('./persist', () => ({
  loadXReply,
  patchXReplyError,
  patchXReplyPosted,
}))

vi.mock('@/lib/x/share', () => ({
  shareToXDetailed,
}))

import {publishXReply} from './publish'

const pendingReply = {
  _id: 'reply-1',
  sourceTweetId: '10',
  sourceUsername: 'honskontot',
  sourceText: 'Original tweet',
  status: 'pending' as const,
  replyText: 'Kackel i tråden.',
  error: null,
  postedTweetId: null,
}

describe('publishXReply', () => {
  beforeEach(() => {
    loadXReply.mockReset()
    patchXReplyError.mockReset()
    patchXReplyPosted.mockReset()
    shareToXDetailed.mockReset()
    loadXReply.mockResolvedValue(pendingReply)
  })

  it('posts a queued reply in the source tweet thread and marks it posted', async () => {
    shareToXDetailed.mockResolvedValue({
      result: 'shared',
      tweetId: 'posted-20',
    })

    await expect(publishXReply('reply-1')).resolves.toEqual({
      postedTweetId: 'posted-20',
    })

    expect(loadXReply).toHaveBeenCalledWith('reply-1')
    expect(shareToXDetailed).toHaveBeenCalledWith({
      text: 'Kackel i tråden.',
      inReplyToTweetId: '10',
    })
    expect(patchXReplyPosted).toHaveBeenCalledWith('reply-1', 'posted-20')
    expect(patchXReplyError).not.toHaveBeenCalled()
  })

  it.each([
    {
      row: null,
      message: 'Hittade inte svaret',
    },
    {
      row: {...pendingReply, status: 'posted'},
      message: 'Svaret är inte i kön',
    },
    {
      row: {...pendingReply, replyText: '   '},
      message: 'Saknar svars-text',
    },
  ])('rejects an invalid row with "$message"', async ({row, message}) => {
    loadXReply.mockResolvedValue(row)

    await expect(publishXReply('reply-1')).rejects.toThrow(message)

    expect(shareToXDetailed).not.toHaveBeenCalled()
    expect(patchXReplyPosted).not.toHaveBeenCalled()
    expect(patchXReplyError).not.toHaveBeenCalled()
  })

  it('reports missing X credentials without patching the row', async () => {
    shareToXDetailed.mockResolvedValue({result: 'skipped'})

    await expect(publishXReply('reply-1')).rejects.toThrow(
      'X-nycklar saknas',
    )

    expect(patchXReplyPosted).not.toHaveBeenCalled()
    expect(patchXReplyError).not.toHaveBeenCalled()
  })

  it('records a failed share and throws the Swedish failure message', async () => {
    shareToXDetailed.mockResolvedValue({
      result: 'failed',
      error: 'X HTTP 403',
    })

    await expect(publishXReply('reply-1')).rejects.toThrow(
      'Kunde inte posta till X: X HTTP 403',
    )

    expect(patchXReplyError).toHaveBeenCalledWith('reply-1', 'X HTTP 403')
    expect(patchXReplyPosted).not.toHaveBeenCalled()
  })

  it('records a generic failure when X supplies no error', async () => {
    shareToXDetailed.mockResolvedValue({result: 'failed'})

    await expect(publishXReply('reply-1')).rejects.toThrow(
      'Kunde inte posta till X',
    )

    expect(patchXReplyError).toHaveBeenCalledWith(
      'reply-1',
      'Kunde inte posta till X',
    )
  })

  it('treats a shared result without a tweet id as failed', async () => {
    shareToXDetailed.mockResolvedValue({result: 'shared'})

    await expect(publishXReply('reply-1')).rejects.toThrow(
      'Kunde inte posta till X: X svarade utan tweet-id',
    )

    expect(patchXReplyError).toHaveBeenCalledWith(
      'reply-1',
      'X svarade utan tweet-id',
    )
    expect(patchXReplyPosted).not.toHaveBeenCalled()
  })
})
