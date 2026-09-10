import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {XMention} from './filter'

const {
  createPendingXReply,
  fetchXMentions,
  generateXReply,
  listPendingReady,
  loadXReplyIndex,
  loadXReplySettings,
  publishXReply,
  saveXMentionsSinceId,
} = vi.hoisted(() => ({
  createPendingXReply: vi.fn(),
  fetchXMentions: vi.fn(),
  generateXReply: vi.fn(),
  listPendingReady: vi.fn(),
  loadXReplyIndex: vi.fn(),
  loadXReplySettings: vi.fn(),
  publishXReply: vi.fn(),
  saveXMentionsSinceId: vi.fn(),
}))

vi.mock('./mentions', () => ({fetchXMentions}))
vi.mock('./generate', () => ({generateXReply}))
vi.mock('./persist', () => ({
  createPendingXReply,
  listPendingReady,
  loadXReplyIndex,
  loadXReplySettings,
  saveXMentionsSinceId,
}))
vi.mock('./publish', () => ({publishXReply}))

import {runXReply} from './ingest'

const firstMention: XMention = {
  id: '100',
  text: '@Kycklingbladet Hur är läget?',
  authorId: 'visitor-1',
  authorUsername: 'besokare',
  inReplyToStatusId: null,
}

const duplicateMention: XMention = {
  id: '200',
  text: '@Kycklingbladet Samma fråga',
  authorId: 'visitor-2',
  authorUsername: 'annan',
  inReplyToStatusId: null,
}

describe('runXReply', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loadXReplySettings.mockResolvedValue({
      mode: 'queue',
      dumhet: 4,
      uppskruvning: 2,
      sinceId: '50',
    })
    fetchXMentions.mockResolvedValue({
      ourUserId: 'our-user',
      mentions: [firstMention, duplicateMention],
    })
    loadXReplyIndex.mockResolvedValue({
      existingSourceIds: new Set(['200']),
      ourPostedIds: new Set(),
    })
    generateXReply.mockResolvedValue({
      text: 'Kackel från redaktionen.',
      promptVersion: 'prompt-v1',
      modelVersion: 'model-v1',
    })
    createPendingXReply.mockResolvedValue('reply-1')
    listPendingReady.mockResolvedValue([])
    publishXReply.mockResolvedValue({postedTweetId: 'posted-1'})
    saveXMentionsSinceId.mockResolvedValue(undefined)
  })

  it('queues eligible mentions, skips duplicates, and advances since_id', async () => {
    await expect(runXReply()).resolves.toEqual({
      ingested: 1,
      posted: 0,
      skipped: 1,
    })

    expect(fetchXMentions).toHaveBeenCalledWith('50')
    expect(generateXReply).toHaveBeenCalledWith({
      text: firstMention.text,
      username: firstMention.authorUsername,
      dumhet: 4,
      uppskruvning: 2,
    })
    expect(createPendingXReply).toHaveBeenCalledWith({
      sourceTweetId: '100',
      sourceUsername: 'besokare',
      sourceText: firstMention.text,
      sourceUrl: 'https://x.com/besokare/status/100',
      replyText: 'Kackel från redaktionen.',
      error: '',
      promptVersion: 'prompt-v1',
      modelVersion: 'model-v1',
    })
    expect(saveXMentionsSinceId).toHaveBeenCalledWith('200')
    expect(listPendingReady).not.toHaveBeenCalled()
    expect(publishXReply).not.toHaveBeenCalled()
  })

  it('auto-posts up to five ready rows and continues after publish failures', async () => {
    loadXReplySettings.mockResolvedValue({
      mode: 'auto',
      dumhet: 4,
      uppskruvning: 2,
      sinceId: null,
    })
    fetchXMentions.mockResolvedValue({ourUserId: 'our-user', mentions: []})
    listPendingReady.mockResolvedValue([
      {_id: 'reply-1'},
      {_id: 'reply-2'},
    ])
    publishXReply
      .mockRejectedValueOnce(new Error('Kunde inte posta till X'))
      .mockResolvedValueOnce({postedTweetId: 'posted-2'})

    await expect(runXReply()).resolves.toEqual({
      ingested: 0,
      posted: 1,
      skipped: 0,
    })

    expect(listPendingReady).toHaveBeenCalledWith(5)
    expect(publishXReply).toHaveBeenNthCalledWith(1, 'reply-1')
    expect(publishXReply).toHaveBeenNthCalledWith(2, 'reply-2')
    expect(saveXMentionsSinceId).not.toHaveBeenCalled()
  })

  it('returns zeros without loading the index when X keys are missing', async () => {
    const error = new Error('X-nycklar saknas')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchXMentions.mockRejectedValue(error)

    await expect(runXReply()).resolves.toEqual({
      ingested: 0,
      posted: 0,
      skipped: 0,
    })

    expect(consoleError).toHaveBeenCalledWith(error)
    expect(loadXReplyIndex).not.toHaveBeenCalled()
    expect(saveXMentionsSinceId).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('stores a pending row when generation fails', async () => {
    fetchXMentions.mockResolvedValue({
      ourUserId: 'our-user',
      mentions: [firstMention],
    })
    loadXReplyIndex.mockResolvedValue({
      existingSourceIds: new Set(),
      ourPostedIds: new Set(),
    })
    generateXReply.mockRejectedValue('okänt fel')

    await expect(runXReply()).resolves.toEqual({
      ingested: 1,
      posted: 0,
      skipped: 0,
    })
    expect(createPendingXReply).toHaveBeenCalledWith(
      expect.objectContaining({
        replyText: '',
        error: 'Kunde inte skriva svaret',
        promptVersion: '',
        modelVersion: '',
      }),
    )
  })

  it('rethrows other fetch errors without advancing since_id', async () => {
    const error = new Error('Kunde inte hämta mentions')
    fetchXMentions.mockRejectedValue(error)

    await expect(runXReply()).rejects.toBe(error)
    expect(loadXReplyIndex).not.toHaveBeenCalled()
    expect(saveXMentionsSinceId).not.toHaveBeenCalled()
  })
})
