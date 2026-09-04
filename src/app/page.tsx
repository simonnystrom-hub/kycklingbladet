import {AlarmArticle} from '@/components/AlarmArticle'
import {EmptyIssue} from '@/components/EmptyIssue'
import {IssueNav} from '@/components/IssueNav'
import {IssueNotices} from '@/components/IssueNotices'
import {SectionHead} from '@/components/SectionHead'
import {WeekLeads} from '@/components/WeekLeads'
import {TAGLINE, TODAY_ISSUE_HEADING} from '@/lib/copy'
import {getAdjacentDates, getAlarmByDate, getLatestAlarm, getSiteSettings, getWeekLeads} from '@/lib/sanity/queries'
import {formatSwedishDate, stockholmToday} from '@/lib/select/stockholm-date'
import type {Metadata} from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [alarm, settings] = await Promise.all([
    getLatestAlarm(),
    getSiteSettings(),
  ])
  const description =
    alarm?.headline?.trim() ||
    settings?.tagline?.trim() ||
    TAGLINE

  return {description}
}

export default async function HomePage() {
  const today = stockholmToday()
  const [todayAlarm, latest] = await Promise.all([
    getAlarmByDate(today),
    getLatestAlarm(),
  ])
  const alarm = todayAlarm ?? latest
  const [adjacent, weekLeads] = await Promise.all([
    alarm ? getAdjacentDates(alarm.date) : Promise.resolve({previous: null, next: null}),
    getWeekLeads(today, alarm?.date ?? null),
  ])

  return (
    <div className="flex flex-col">
      <section className="sm:order-2">
        <SectionHead>{TODAY_ISSUE_HEADING}</SectionHead>
        <p
          className="text-[var(--brass)]"
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            fontVariant: 'small-caps',
          }}
        >
          {formatSwedishDate(today)}
        </p>
        {alarm ? (
          <>
            <AlarmArticle alarm={alarm} />
            <IssueNotices notices={alarm.notices} date={alarm.date} />
            <IssueNav previous={adjacent.previous} next={adjacent.next} />
          </>
        ) : (
          <div className="mt-6">
            <EmptyIssue />
          </div>
        )}
      </section>
      <WeekLeads
        items={weekLeads}
        className="mt-10 sm:order-1 sm:mt-0 sm:mb-10 lg:mb-12"
      />
    </div>
  )
}
