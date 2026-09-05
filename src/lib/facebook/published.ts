import {extraExtraPath} from '@/lib/extra-extra/path'
import {alarmPath, alarmSlugOrFallback} from '@/lib/select/alarm-path'
import {getWriteClient} from '@/lib/sanity/write-client'
import {absoluteUrl} from '@/lib/site-url'
import {
  facebookExtraMessage,
  facebookLeadMessage,
  type FacebookExtraCopy,
  type FacebookLeadCopy,
} from './message'
import {shareToFacebook} from './share'

type StoredLead = FacebookLeadCopy & {
  date: string
  slug?: string | null
  imageUrl?: string | null
}

export async function sharePublishedLead(id: string): Promise<void> {
  try {
    const alarm = await getWriteClient().fetch<StoredLead | null>(
      `*[_id == $id][0]{
        date, slug, headline, body, expertVoice, expertHeadline, expertText, imageCaption,
        "imageUrl": image.asset->url
      }`,
      {id},
    )
    if (!alarm?.headline?.trim() || !alarm.body?.trim() || !alarm.date) {
      console.error(`Hoppar över Facebook: larm ${id} saknar text`)
      return
    }
    await shareToFacebook({
      message: facebookLeadMessage(alarm),
      imageUrl: alarm.imageUrl,
      articleUrl: absoluteUrl(
        alarmPath(alarm.date, alarmSlugOrFallback(alarm.headline, alarm.slug)),
      ),
    })
  } catch (error) {
    console.error(`Kunde inte posta larm ${id} till Facebook`, error)
  }
}

export async function sharePublishedExtra(
  date: string,
  extra: FacebookExtraCopy & {imageUrl?: string | null},
): Promise<void> {
  try {
    await shareToFacebook({
      message: facebookExtraMessage(extra),
      imageUrl: extra.imageUrl,
      articleUrl: absoluteUrl(extraExtraPath(date)),
    })
  } catch (error) {
    console.error(`Kunde inte posta Extra Extra ${date} till Facebook`, error)
  }
}
