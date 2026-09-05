import type {Metadata} from 'next'
import {AlarmArticle} from '@/components/AlarmArticle'
import {IssueExtraTeaser} from '@/components/IssueExtraTeaser'
import {IssueNav} from '@/components/IssueNav'
import {IssueNotices} from '@/components/IssueNotices'
import {hasExtraExtra} from '@/lib/extra-extra/has-extra'
import {cartoonImageUrl, shareImages} from '@/lib/og'
import {getAdjacentDates, getAlarmByDate, getExtraByDate} from '@/lib/sanity/queries'
import {isIsoDateString} from '@/lib/select/stockholm-date'
import {notFound} from 'next/navigation'

export const revalidate = 60

type ArchiveDatePageProps = {
  params: Promise<{date: string}>
}

export async function generateMetadata({
  params,
}: ArchiveDatePageProps): Promise<Metadata> {
  const {date} = await params
  if (!isIsoDateString(date)) return {}
  const [alarm, extra] = await Promise.all([
    getAlarmByDate(date),
    getExtraByDate(date),
  ])
  if (!alarm && !hasExtraExtra(extra)) return {}
  const title = alarm?.headline ?? extra?.headline
  const canonical = `/arkiv/${date}`
  const images = shareImages(
    cartoonImageUrl(hasExtraExtra(extra) ? extra : null),
    cartoonImageUrl(alarm),
  )
  return {
    title,
    description: title,
    alternates: {canonical},
    openGraph: {
      title,
      description: title,
      url: canonical,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      images,
    },
  }
}

export default async function ArchiveDatePage({params}: ArchiveDatePageProps) {
  const {date} = await params

  if (!isIsoDateString(date)) {
    notFound()
  }

  const [alarm, extra] = await Promise.all([
    getAlarmByDate(date),
    getExtraByDate(date),
  ])
  if (!alarm && !hasExtraExtra(extra)) {
    notFound()
  }

  const {previous, next} = await getAdjacentDates(date)

  return (
    <div>
      <IssueExtraTeaser extra={extra} date={date} />
      {alarm ? <AlarmArticle alarm={alarm} showDate /> : null}
      {alarm ? <IssueNotices notices={alarm.notices} date={alarm.date} /> : null}
      <IssueNav previous={previous} next={next} />
    </div>
  )
}
