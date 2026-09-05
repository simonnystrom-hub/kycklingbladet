import {extraExtraPath} from '@/lib/extra-extra/path'
import {alarmIdForDate} from '@/lib/select/alarm-id'
import {getWriteClient} from '@/lib/sanity/write-client'
import {absoluteUrl} from '@/lib/site-url'
import {
  facebookExtraMessage,
  facebookLeadMessage,
  type FacebookExtraCopy,
  type FacebookLeadCopy,
} from './message'
import {shareToFacebook} from './share'

type StoredLead = FacebookLeadCopy & {imageUrl?: string | null}

export async function sharePublishedLead(date: string): Promise<void> {
  try {
    const alarm = await getWriteClient().fetch<StoredLead | null>(
      `*[_id == $id][0]{
        headline, body, expertVoice, expertHeadline, expertText, imageCaption,
        "imageUrl": image.asset->url,
        notices[]{headline, body}
      }`,
      {id: alarmIdForDate(date)},
    )
    if (!alarm?.headline?.trim() || !alarm.body?.trim()) {
      console.error(`Hoppar över Facebook: larm ${date} saknar text`)
      return
    }
    await shareToFacebook({
      message: facebookLeadMessage(alarm),
      imageUrl: alarm.imageUrl,
      articleUrl: absoluteUrl(`/arkiv/${date}`),
    })
  } catch (error) {
    console.error(`Kunde inte posta larm ${date} till Facebook`, error)
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
