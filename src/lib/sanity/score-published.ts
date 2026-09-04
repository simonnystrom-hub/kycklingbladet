import {scoreHumor, type HumorPiece} from '@/lib/generate/score-humor'
import {getWriteClient} from './write-client'

const SAMPLE_SIZE = 4

type StoredPiece = HumorPiece & {_id: string}

export async function fetchHumorSample(excludeId: string): Promise<HumorPiece[]> {
  const client = getWriteClient()
  const params = {id: excludeId, draftId: `drafts.${excludeId}`}
  const scored = await client.fetch<HumorPiece[]>(
    `*[_type == "alarm" && !(_id in [$id, $draftId]) && defined(humorScore)] | order(date desc)[0...${SAMPLE_SIZE}]{date, kicker, headline, body, humorScore}`,
    params,
  )
  if (scored.length >= 2) return scored
  return client.fetch<HumorPiece[]>(
    `*[_type == "alarm" && !(_id in [$id, $draftId])] | order(date desc)[0...${SAMPLE_SIZE}]{date, kicker, headline, body, humorScore}`,
    params,
  )
}

export async function fetchUnscoredAlarms(): Promise<StoredPiece[]> {
  return getWriteClient().fetch(
    `*[_type == "alarm" && !defined(humorScore)] | order(date asc){_id, date, kicker, headline, body}`,
  )
}

async function fetchUnscoredById(id: string): Promise<StoredPiece | null> {
  return getWriteClient().fetch(
    `*[_id == $id && !defined(humorScore)][0]{_id, date, kicker, headline, body}`,
    {id},
  )
}

export async function patchHumorScore(id: string, humorScore: number): Promise<void> {
  await getWriteClient().patch(id).set({humorScore}).commit()
}

export async function scoreAlarmIfMissing(id: string): Promise<number | null> {
  const alarm = await fetchUnscoredById(id)
  if (!alarm) return null
  const sample = await fetchHumorSample(id)
  const humorScore = await scoreHumor({piece: alarm, sample})
  await patchHumorScore(id, humorScore)
  return humorScore
}
