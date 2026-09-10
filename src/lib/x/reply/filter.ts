export const X_REPLY_HANDLE = 'Kycklingbladet'

export type XMention = {
  id: string
  text: string
  authorId: string
  authorUsername: string
  inReplyToStatusId: string | null
}

export type MentionSkipContext = {
  ourUserId: string
  existingSourceIds: Set<string>
  ourPostedIds: Set<string>
}

export type MentionSkipReason = 'self' | 'empty' | 'duplicate' | 'loop'

export function mentionSkipReason(
  mention: XMention,
  ctx: MentionSkipContext,
): MentionSkipReason | null {
  if (mention.authorId === ctx.ourUserId) return 'self'
  if (mention.authorUsername.replace(/^@/, '').toLowerCase() === X_REPLY_HANDLE.toLowerCase()) {
    return 'self'
  }
  if (!mention.text.trim()) return 'empty'
  if (ctx.existingSourceIds.has(mention.id)) return 'duplicate'
  if (mention.inReplyToStatusId && ctx.ourPostedIds.has(mention.inReplyToStatusId)) return 'loop'
  return null
}

export function sourceTweetUrl(username: string, id: string): string {
  return `https://x.com/${username.replace(/^@/, '')}/status/${id}`
}

export function maxSnowflake(ids: string[]): string | null {
  if (ids.length === 0) return null
  return ids.reduce((max, id) => (BigInt(id) > BigInt(max) ? id : max))
}
