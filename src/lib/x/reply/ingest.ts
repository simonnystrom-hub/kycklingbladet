import {
  maxSnowflake,
  mentionSkipReason,
  sourceTweetUrl,
} from './filter'
import {generateXReply} from './generate'
import {fetchXMentions} from './mentions'
import {
  createPendingXReply,
  listPendingReady,
  loadXReplyIndex,
  loadXReplySettings,
  saveXMentionsSinceId,
} from './persist'
import {publishXReply} from './publish'

export async function runXReply(): Promise<{
  ingested: number
  posted: number
  skipped: number
}> {
  const settings = await loadXReplySettings()

  let fetched: Awaited<ReturnType<typeof fetchXMentions>>
  try {
    fetched = await fetchXMentions(settings.sinceId)
  } catch (error) {
    if (error instanceof Error && error.message === 'X-nycklar saknas') {
      console.error(error)
      return {ingested: 0, posted: 0, skipped: 0}
    }
    throw error
  }

  const index = await loadXReplyIndex()
  const skipContext = {
    ourUserId: fetched.ourUserId,
    existingSourceIds: index.existingSourceIds,
    ourPostedIds: index.ourPostedIds,
  }
  let skipped = 0
  let ingested = 0

  for (const mention of fetched.mentions) {
    if (mentionSkipReason(mention, skipContext)) {
      skipped += 1
      continue
    }

    const pending = {
      sourceTweetId: mention.id,
      sourceUsername: mention.authorUsername,
      sourceText: mention.text,
      sourceUrl: sourceTweetUrl(mention.authorUsername, mention.id),
      replyText: '',
      error: '',
      promptVersion: '',
      modelVersion: '',
    }

    try {
      const generated = await generateXReply({
        text: mention.text,
        username: mention.authorUsername,
        dumhet: settings.dumhet,
        uppskruvning: settings.uppskruvning,
      })
      pending.replyText = generated.text
      pending.promptVersion = generated.promptVersion
      pending.modelVersion = generated.modelVersion
    } catch (error) {
      pending.error =
        error instanceof Error && error.message
          ? error.message
          : 'Kunde inte skriva svaret'
    }

    await createPendingXReply(pending)
    ingested += 1
  }

  const newestMentionId = maxSnowflake(
    fetched.mentions.map((mention) => mention.id),
  )
  if (newestMentionId !== null) {
    await saveXMentionsSinceId(newestMentionId)
  }

  let posted = 0
  if (settings.mode === 'auto') {
    const ready = await listPendingReady(5)
    for (const reply of ready) {
      try {
        await publishXReply(reply._id)
        posted += 1
      } catch {
        // publishXReply records the error on the pending row.
      }
    }
  }

  return {ingested, posted, skipped}
}
