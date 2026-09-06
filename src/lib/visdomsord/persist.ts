import {getWriteClient} from '@/lib/sanity/write-client'
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
