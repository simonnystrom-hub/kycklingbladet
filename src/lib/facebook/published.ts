import {extraExtraItemPath, extraExtraPath} from '@/lib/extra-extra/path'
import {alarmPath, alarmSlugOrFallback} from '@/lib/select/alarm-path'
import {getWriteClient} from '@/lib/sanity/write-client'
import {absoluteUrl} from '@/lib/site-url'
import {xExtraMessage, xLeadMessage} from '@/lib/x/message'
import {shareToX} from '@/lib/x/share'
import {
  facebookExtraMessage,
  facebookLeadMessage,
  type FacebookExtraCopy,
  type FacebookLeadCopy,
} from './message'
import {shareToFacebook, type ShareToFacebookResult} from './share'

type StoredLead = FacebookLeadCopy & {
  date: string
  slug?: string | null
  imageUrl?: string | null
  xHashtags?: string | null
}

export async function sharePublishedLead(id: string): Promise<ShareToFacebookResult> {
  try {
    const alarm = await getWriteClient().fetch<StoredLead | null>(
      `*[_id == $id][0]{
        date, slug, headline, body, expertVoice, expertHeadline, expertText, imageCaption, xHashtags,
        "imageUrl": image.asset->url
      }`,
      {id},
    )
    if (!alarm?.headline?.trim() || !alarm.body?.trim() || !alarm.date) {
      console.error(`Hoppar över Facebook och X: larm ${id} saknar text`)
      return 'skipped'
    }
    const articleUrl = absoluteUrl(
      alarmPath(alarm.date, alarmSlugOrFallback(alarm.headline, alarm.slug)),
    )
    const [facebook] = await Promise.all([
      shareToFacebook({
        message: facebookLeadMessage(alarm),
        imageUrl: alarm.imageUrl,
        articleUrl,
      }),
      shareToX({
        text: xLeadMessage(alarm, articleUrl, alarm.xHashtags),
        imageUrl: alarm.imageUrl,
      }),
    ])
    return facebook
  } catch (error) {
    console.error(`Kunde inte posta larm ${id} till Facebook eller X`, error)
    return 'failed'
  }
}

export async function sharePublishedExtra(
  date: string,
  extra: FacebookExtraCopy & {id?: string | null; imageUrl?: string | null},
): Promise<void> {
  const extraId = extra.id?.trim()
  const articleUrl = absoluteUrl(
    extraId ? extraExtraItemPath(date, extraId) : extraExtraPath(date),
  )
  try {
    await Promise.all([
      shareToFacebook({
        message: facebookExtraMessage(extra),
        imageUrl: extra.imageUrl,
        articleUrl,
      }),
      shareToX({
        text: xExtraMessage(extra, articleUrl, extra.xHashtags),
        imageUrl: extra.imageUrl,
      }),
    ])
  } catch (error) {
    console.error(`Kunde inte posta Extra Extra ${date} till Facebook eller X`, error)
  }
}
