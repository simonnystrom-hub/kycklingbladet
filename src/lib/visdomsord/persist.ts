import {getWriteClient} from '@/lib/sanity/write-client'
import {generateVisdomsordDrafts, takeFreshDrafts} from './generate'
import {normalizeQuoteKey} from './normalize'
import type {VisdomsordDraft} from './parse'

export async function createVisdomsord(drafts: VisdomsordDraft[]): Promise<number> {
  const client = getWriteClient()

  for (const draft of drafts) {
    await client.create({
      _type: 'visdomsord',
      quote: draft.quote,
      henName: draft.henName,
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

  for (const id of ids) {
    try {
      const row = await client.fetch<VisdomsordToRewrite | null>(
        '*[_type == "visdomsord" && _id == $id][0]{_id, quote, henName, usedDate}',
        {id},
      )
      if (!row || row.usedDate !== undefined && row.usedDate !== null) {
        skipped++
        continue
      }

      const existingQuotes = await client.fetch<string[]>(
        '*[_type == "visdomsord" && _id != $id].quote',
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
