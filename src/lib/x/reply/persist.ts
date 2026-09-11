import {
  EXTRA_KNOB_DEFAULT,
  parseExtraKnob,
} from '@/lib/generate/extra-prompt'
import {getWriteClient} from '@/lib/sanity/write-client'

export type XReplySettings = {
  mode: 'auto' | 'queue'
  dumhet: number
  uppskruvning: number
  sinceId: string | null
}

export type XReplyRow = {
  _id: string
  sourceTweetId: string
  sourceUsername: string
  sourceText: string
  status: 'pending' | 'posted' | 'skipped'
  replyText: string
  error: string | null
  postedTweetId: string | null
}

type SettingsRow = {
  xReplyMode?: unknown
  xReplyDumhet?: unknown
  xReplyUppskruvning?: unknown
  xMentionsSinceId?: unknown
}

function xReplyKnobsFromRow(row: SettingsRow | null): {dumhet: number; uppskruvning: number} {
  const dumhet = parseExtraKnob(row?.xReplyDumhet, EXTRA_KNOB_DEFAULT)
  const uppskruvning = parseExtraKnob(row?.xReplyUppskruvning, EXTRA_KNOB_DEFAULT)
  const oldDefaultPair =
    parseExtraKnob(row?.xReplyDumhet, 0) === 3 &&
    parseExtraKnob(row?.xReplyUppskruvning, 0) === 3
  if (oldDefaultPair) {
    return {dumhet: EXTRA_KNOB_DEFAULT, uppskruvning: EXTRA_KNOB_DEFAULT}
  }
  return {dumhet, uppskruvning}
}

type XReplyIndexRow = {
  sourceTweetId: string
  postedTweetId?: string | null
}

type PendingXReplyInput = {
  sourceTweetId: string
  sourceUsername: string
  sourceText: string
  sourceUrl: string
  replyText: string
  error: string
  promptVersion: string
  modelVersion: string
}

const X_REPLY_FIELDS =
  '_id, sourceTweetId, sourceUsername, sourceText, status, replyText, error, postedTweetId'

export async function loadXReplySettings(): Promise<XReplySettings> {
  const client = getWriteClient()
  const row = await client.fetch<SettingsRow | null>(
    '*[_id == "siteSettings"][0]{xReplyMode, xReplyDumhet, xReplyUppskruvning, xMentionsSinceId}',
  )

  const knobs = xReplyKnobsFromRow(row)

  return {
    mode: row?.xReplyMode === 'auto' ? 'auto' : 'queue',
    dumhet: knobs.dumhet,
    uppskruvning: knobs.uppskruvning,
    sinceId:
      typeof row?.xMentionsSinceId === 'string' && row.xMentionsSinceId
        ? row.xMentionsSinceId
        : null,
  }
}

export async function loadXReplyIndex(): Promise<{
  existingSourceIds: Set<string>
  ourPostedIds: Set<string>
}> {
  const client = getWriteClient()
  const rows = await client.fetch<XReplyIndexRow[]>(
    '*[_type == "xReply" && !(_id in path("drafts.**"))]{sourceTweetId, postedTweetId}',
  )

  return {
    existingSourceIds: new Set(rows.map((row) => row.sourceTweetId)),
    ourPostedIds: new Set(
      rows
        .map((row) => row.postedTweetId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  }
}

export async function createPendingXReply(
  doc: PendingXReplyInput,
): Promise<string> {
  const client = getWriteClient()
  const created = await client.create({
    _type: 'xReply',
    status: 'pending',
    ...doc,
  })
  return created._id
}

export async function saveXMentionsSinceId(id: string): Promise<void> {
  const client = getWriteClient()
  await client.patch('siteSettings').set({xMentionsSinceId: id}).commit()
}

export async function listPendingReady(limit: number): Promise<XReplyRow[]> {
  const client = getWriteClient()
  return client.fetch<XReplyRow[]>(
    `*[
      _type == "xReply" &&
      !(_id in path("drafts.**")) &&
      status == "pending" &&
      defined(replyText) &&
      replyText != "" &&
      (!defined(error) || error == "") &&
      dateTime(_createdAt) > dateTime(now()) - 60 * 60 * 24 * 30
    ] | order(_createdAt asc)[0...$limit]{${X_REPLY_FIELDS}}`,
    {limit},
  )
}

export async function patchXReplyPosted(
  id: string,
  postedTweetId: string,
): Promise<void> {
  const client = getWriteClient()
  await client
    .patch(id)
    .set({status: 'posted', postedTweetId})
    .commit()
}

export async function patchXReplyError(
  id: string,
  error: string,
): Promise<void> {
  const client = getWriteClient()
  await client.patch(id).set({error}).commit()
}

export async function loadXReply(id: string): Promise<XReplyRow | null> {
  const client = getWriteClient()
  return client.fetch<XReplyRow | null>(
    `*[_type == "xReply" && _id == $id && !(_id in path("drafts.**"))][0]{${X_REPLY_FIELDS}}`,
    {id},
  )
}

export async function patchXReplyDraft(
  id: string,
  draft: {
    replyText: string
    promptVersion: string
    modelVersion: string
  },
): Promise<void> {
  const client = getWriteClient()
  await client.patch(id).set({...draft, error: ''}).commit()
}

export const X_REPLY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function xReplyMaxAgeCutoff(now = new Date()): string {
  return new Date(now.getTime() - X_REPLY_MAX_AGE_MS).toISOString()
}

export async function deleteOldXReplies(now = new Date()): Promise<number> {
  const client = getWriteClient()
  const cutoff = xReplyMaxAgeCutoff(now)
  const ids = await client.fetch<string[]>(
    '*[_type == "xReply" && dateTime(_createdAt) < dateTime($cutoff)]._id',
    {cutoff},
  )
  await Promise.all(ids.map((id) => client.delete(id)))
  return ids.length
}
