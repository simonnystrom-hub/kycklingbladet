import type {Metadata} from 'next'
import {AlarmArticle} from '@/components/AlarmArticle'
import {IssueNav} from '@/components/IssueNav'
import {cartoonImageUrl, shareImages} from '@/lib/og'
import {getAdjacentLarm, getAlarmByDateAndSlug} from '@/lib/sanity/queries'
import {alarmPath, alarmSlugOrFallback} from '@/lib/select/alarm-path'
import {isIsoDateString} from '@/lib/select/stockholm-date'
import {notFound} from 'next/navigation'

export const revalidate = 60

type AlarmPageProps = {
  params: Promise<{date: string; slug: string}>
}

export async function generateMetadata({params}: AlarmPageProps): Promise<Metadata> {
  const {date, slug} = await params
  if (!isIsoDateString(date)) return {}
  const alarm = await getAlarmByDateAndSlug(date, slug)
  if (!alarm) return {}
  const canonical = alarmPath(date, alarmSlugOrFallback(alarm.headline, alarm.slug))
  const images = shareImages(cartoonImageUrl(alarm))
  return {
    title: alarm.headline,
    description: alarm.headline,
    alternates: {canonical},
    openGraph: {
      title: alarm.headline,
      description: alarm.headline,
      url: canonical,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      images,
    },
  }
}

export default async function AlarmPage({params}: AlarmPageProps) {
  const {date, slug} = await params
  if (!isIsoDateString(date)) {
    notFound()
  }

  const alarm = await getAlarmByDateAndSlug(date, slug)
  if (!alarm) {
    notFound()
  }

  const canonicalSlug = alarmSlugOrFallback(alarm.headline, alarm.slug)
  const {previous, next} = await getAdjacentLarm(date, canonicalSlug)

  return (
    <div>
      <AlarmArticle alarm={alarm} showDate href={alarmPath(date, canonicalSlug)} />
      <IssueNav
        previousHref={previous}
        nextHref={next}
        previousLabel="« Föregående"
        nextLabel="Nästa »"
      />
    </div>
  )
}
