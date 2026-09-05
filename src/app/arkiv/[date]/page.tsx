import {AlarmArticle} from '@/components/AlarmArticle'
import {IssueExtra} from '@/components/IssueExtra'
import {IssueNav} from '@/components/IssueNav'
import {IssueNotices} from '@/components/IssueNotices'
import {getAdjacentDates, getAlarmByDate} from '@/lib/sanity/queries'
import {isIsoDateString} from '@/lib/select/stockholm-date'
import {notFound} from 'next/navigation'

export const revalidate = 60

type ArchiveDatePageProps = {
  params: Promise<{date: string}>
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

  const {previous, next} = await getAdjacentDates(date)

  return (
    <div>
      <AlarmArticle alarm={alarm} showDate />
      <IssueExtra extra={alarm.extraExtra} date={alarm.date} />
      <IssueNotices notices={alarm.notices} date={alarm.date} />
      <IssueNav previous={previous} next={next} />
    </div>
  )
}
