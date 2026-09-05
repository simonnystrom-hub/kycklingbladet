import type {Metadata} from 'next'
import {getAlarmByDate} from '@/lib/sanity/queries'
import {alarmPath, alarmSlugOrFallback} from '@/lib/select/alarm-path'
import {isIsoDateString} from '@/lib/select/stockholm-date'
import {notFound, permanentRedirect} from 'next/navigation'

export const revalidate = 60

type ArchiveDatePageProps = {
  params: Promise<{date: string}>
}

export async function generateMetadata({
  params,
}: ArchiveDatePageProps): Promise<Metadata> {
  const {date} = await params
  if (!isIsoDateString(date)) return {}
  const alarm = await getAlarmByDate(date)
  if (!alarm) return {}
  const canonical = alarmPath(date, alarmSlugOrFallback(alarm.headline, alarm.slug))
  return {
    title: alarm.headline,
    alternates: {canonical},
  }
}

export default async function ArchiveDatePage({params}: ArchiveDatePageProps) {
  const {date} = await params

  if (!isIsoDateString(date)) {
    notFound()
  }

  const alarm = await getAlarmByDate(date)
  if (!alarm) {
    notFound()
  }

  permanentRedirect(alarmPath(date, alarmSlugOrFallback(alarm.headline, alarm.slug)))
}
