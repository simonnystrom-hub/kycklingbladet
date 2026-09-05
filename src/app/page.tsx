import {AlarmArticle} from '@/components/AlarmArticle'
import {EmptyIssue} from '@/components/EmptyIssue'
import {IssueExtra} from '@/components/IssueExtra'
import {IssueNav} from '@/components/IssueNav'
import {SectionHead} from '@/components/SectionHead'
import {WeekLeads} from '@/components/WeekLeads'
import {HOME_DESCRIPTION, HOME_TITLE, TODAY_ISSUE_HEADING} from '@/lib/copy'
import {cartoonImageUrl, shareImages} from '@/lib/og'
import {
  getAdjacentDates,
  getAlarmsByDate,
  getLatestAlarm,
  getWeekLeads,
  getExtraByDate,
} from '@/lib/sanity/queries'
import {alarmPath, alarmSlugOrFallback} from '@/lib/select/alarm-path'
import {formatSwedishDate, stockholmToday} from '@/lib/select/stockholm-date'
import type {Metadata} from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const today = stockholmToday()
  const [todayAlarms, latest, extra] = await Promise.all([
    getAlarmsByDate(today),
    getLatestAlarm(),
    getExtraByDate(today),
  ])
  const alarm = todayAlarms[0] ?? latest
  const images = shareImages(cartoonImageUrl(extra), cartoonImageUrl(alarm))

  return {
    title: {absolute: HOME_TITLE},
    description: HOME_DESCRIPTION,
    alternates: {canonical: '/'},
    openGraph: {
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: '/',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images,
    },
  }
}

export default async function HomePage() {
  const today = stockholmToday()
  const [todayAlarms, latest, extra] = await Promise.all([
    getAlarmsByDate(today),
    getLatestAlarm(),
    getExtraByDate(today),
  ])
  const alarms =
    todayAlarms.length > 0
      ? todayAlarms
      : latest
        ? await getAlarmsByDate(latest.date)
        : []
  const shownDate = alarms[0]?.date ?? null
  const [adjacent, weekLeads] = await Promise.all([
    shownDate ? getAdjacentDates(shownDate) : Promise.resolve({previous: null, next: null}),
    getWeekLeads(today, shownDate),
  ])

  return (
    <div className="flex flex-col">
      <section className="sm:order-2">
        <IssueExtra extra={extra} date={today} />
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
        {alarms.length > 0 ? (
          <>
            {alarms.map((alarm, index) => (
              <div
                key={alarm._id}
                className={
                  index > 0
                    ? 'mt-12 border-t border-[var(--rule)] pt-10 lg:mt-16 lg:pt-12'
                    : undefined
                }
              >
                <AlarmArticle
                  alarm={alarm}
                  href={alarmPath(
                    alarm.date,
                    alarmSlugOrFallback(alarm.headline, alarm.slug),
                  )}
                />
              </div>
            ))}
            <IssueNav
              previousHref={adjacent.previous ? `/arkiv/${adjacent.previous}` : null}
              nextHref={adjacent.next ? `/arkiv/${adjacent.next}` : null}
            />
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
