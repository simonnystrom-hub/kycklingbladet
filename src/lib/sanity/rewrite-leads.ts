import {generateAlarm} from '@/lib/generate/claude'
import {getWriteClient} from './write-client'

export type LeadToRewrite = {
  _id: string
  date: string
  sourceHeadline: string
  sourceNewspaper: string
}

export async function fetchLeadsToRewrite(): Promise<LeadToRewrite[]> {
  return getWriteClient().fetch(
    `*[_type == "alarm"] | order(date asc){_id, date, sourceHeadline, sourceNewspaper}`,
  )
}

export async function rewriteLead(alarm: LeadToRewrite): Promise<string> {
  const {generated, modelVersion, promptVersion} = await generateAlarm({
    text: alarm.sourceHeadline,
    newspaperName: alarm.sourceNewspaper,
  })
  const id = alarm._id.replace(/^drafts\./, '')
  await getWriteClient()
    .patch(id)
    .set({
      kicker: generated.kicker,
      headline: generated.headline,
      body: generated.body,
      expertVoice: generated.expertVoice,
      expertHeadline: generated.expertHeadline,
      expertText: generated.expertText,
      promptVersion,
      modelVersion,
    })
    .unset(['humorScore'])
    .commit()
  return generated.headline
}
