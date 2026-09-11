import {getWriteClient} from '@/lib/sanity/write-client'
import {generateVisdomsordDrafts, takeFreshDrafts} from './generate'
import {normalizeQuoteKey} from './normalize'
import type {VisdomsordDraft} from './parse'
import {compareVisdomsordQueue} from './queue'

type UnusedQueueRow = {
  _id: string
  queueOrder?: number | null
  _createdAt: string
}

export async function createVisdomsord(drafts: VisdomsordDraft[]): Promise<number> {
  if (drafts.length === 0) return 0
  const client = getWriteClient()
  const unused =
    (await client.fetch<UnusedQueueRow[]>(
      `*[_type == "visdomsord" && !(_id in path("drafts.**")) && !defined(usedDate)]{_id, queueOrder, _createdAt}`,
    )) ?? []
  const sorted = [...unused].sort(compareVisdomsordQueue)
  for (const [index, row] of sorted.entries()) {
    if (row.queueOrder !== index) {
      await client.patch(row._id).set({queueOrder: index}).commit()
    }
  }

  for (const [index, draft] of drafts.entries()) {
    await client.create({
      _type: 'visdomsord',
      quote: draft.quote,
      henName: draft.henName,
      queueOrder: sorted.length + index,
    })
  }

  return drafts.length
}

type VisdomsordToRewrite = {
  _id: string
  quote: string
  henName: string
  usedDate?: string | null
}

export async function rewriteVisdomsord(
  ids: string[],
): Promise<{rewritten: number; skipped: number}> {
  const client = getWriteClient()
  let rewritten = 0
  let skipped = 0

  for (const id of [...new Set(ids)]) {
    try {
      const row = await client.fetch<VisdomsordToRewrite | null>(
        '*[_type == "visdomsord" && _id == $id && !(_id in path("drafts.**"))][0]{_id, quote, henName, usedDate}',
        {id},
      )
      if (!row || row.usedDate !== undefined && row.usedDate !== null) {
        skipped++
        continue
      }

      const existingQuotes = await client.fetch<string[]>(
        '*[_type == "visdomsord" && _id != $id && !(_id in path("drafts.**"))].quote',
        {id: row._id},
      )
      const drafts = await generateVisdomsordDrafts({count: 1, existingQuotes})
      const existingKeys = new Set(
        existingQuotes.map(normalizeQuoteKey).filter(Boolean),
      )
      const [draft] = takeFreshDrafts(drafts, existingKeys)
      if (!draft) {
        skipped++
        continue
      }

      await client
        .patch(row._id)
        .set({quote: draft.quote, henName: draft.henName})
        .unset(['image', 'imageCaption', 'imageShotType', 'imagePrompt'])
        .commit()
      rewritten++
    } catch {
      skipped++
    }
  }

  return {rewritten, skipped}
}
