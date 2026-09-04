import type {AlarmNotice} from '@/lib/sanity/types'
import {formatSwedishDateShort} from '@/lib/select/stockholm-date'

function NoticeSource({notice, date}: {notice: AlarmNotice; date: string}) {
  return (
    <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
      Ursprungligen {notice.sourceNewspaper}, {formatSwedishDateShort(date)}
      {' · «'}
      <a
        href={notice.sourceAlarmindexUrl}
        rel="noreferrer"
        target="_blank"
        className="text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-2 hover:text-[var(--ink)]"
      >
        {notice.sourceHeadline}
      </a>
      {'»'}
    </p>
  )
}

export function IssueNotices({
  notices,
  date,
}: {
  notices?: AlarmNotice[] | null
  date: string
}) {
  if (!notices?.length) return null

  return (
    <section className="mt-10 border-t border-[var(--rule)] pt-8 lg:mt-14 lg:pt-10">
      <p
        className="text-[var(--brass)]"
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          fontVariant: 'small-caps',
        }}
      >
        Notiser
      </p>
      <ul>
        {notices.map((notice) => {
          const paragraphs = notice.body.split('\n\n').filter(Boolean)
          return (
            <li
              key={notice.sourceHeadlineId || notice.headline}
              className="mt-6 border-t border-[var(--rule)] pt-6 first:mt-4 first:border-t-0 first:pt-0"
            >
              <h2 className="font-serif text-[1.25rem] leading-snug text-[var(--ink)] sm:text-[1.4rem] lg:text-[1.55rem]">
                {notice.headline}
              </h2>
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-3 leading-relaxed text-[var(--ink-muted)] lg:text-[1.0625rem] lg:leading-7"
                >
                  {paragraph}
                </p>
              ))}
              <NoticeSource notice={notice} date={date} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
