import {dataset} from '../src/lib/sanity/client'
import {getWriteClient} from '../src/lib/sanity/write-client'
import {fetchLeadsToRewrite} from '../src/lib/sanity/rewrite-leads'

/** First kb-v6 batch, after scoring, before the second rewrite. */
const RESTORE_TIME = process.env.RESTORE_TIME?.trim() || '2026-09-04T21:35:50.000Z'

const LEAD_FIELDS = [
  'kicker',
  'headline',
  'body',
  'expertVoice',
  'expertHeadline',
  'expertText',
  'promptVersion',
  'modelVersion',
  'humorScore',
] as const

type HistoricLead = {
  _id: string
  kicker?: string
  headline?: string
  body?: string
  expertVoice?: string
  expertHeadline?: string
  expertText?: string
  promptVersion?: string
  modelVersion?: string
  humorScore?: number
}

async function fetchHistoric(id: string): Promise<HistoricLead | null> {
  const result = await getWriteClient().request<{documents?: HistoricLead[]}>({
    uri: `/data/history/${dataset}/documents/${id}`,
    query: {time: RESTORE_TIME},
  })
  return result.documents?.[0] ?? null
}

async function run() {
  const alarms = await fetchLeadsToRewrite()
  console.log(`Återställer ${alarms.length} huvudnyheter till ${RESTORE_TIME}.`)
  for (const alarm of alarms) {
    const historic = await fetchHistoric(alarm._id.replace(/^drafts\./, ''))
    if (!historic?.headline || !historic.body) {
      console.error(`${alarm.date}: ingen historik`)
      continue
    }
    const next: Record<string, string | number> = {}
    for (const field of LEAD_FIELDS) {
      const value = historic[field]
      if (value != null && value !== '') next[field] = value
    }
    const patch = getWriteClient().patch(alarm._id.replace(/^drafts\./, '')).set(next)
    if (historic.humorScore == null) patch.unset(['humorScore'])
    await patch.commit()
    console.log(`${alarm.date}: ${historic.headline}`)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
