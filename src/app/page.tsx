import type {Metadata} from 'next'
import {AlarmArticle} from '@/components/AlarmArticle'
import {EmptyIssue} from '@/components/EmptyIssue'
import {getLatestAlarm, getSiteSettings} from '@/lib/sanity/queries'

export const revalidate = 60

const FALLBACK_TAGLINE = 'Utkommer dagligen, mot bättre vetande'

export async function generateMetadata(): Promise<Metadata> {
  const [alarm, settings] = await Promise.all([
    getLatestAlarm(),
    getSiteSettings(),
  ])
  const description =
    alarm?.headline?.trim() ||
    settings?.tagline?.trim() ||
    FALLBACK_TAGLINE

  return {description}
}

export default async function HomePage() {
  const alarm = await getLatestAlarm()
  if (!alarm) return <EmptyIssue />
  return <AlarmArticle alarm={alarm} showDate />
}
