import type {Alarm} from '@/lib/sanity/types'
import {formatSwedishDate, formatSwedishDateShort} from '@/lib/select/stockholm-date'

type AlarmArticleProps = {
  alarm: Alarm
  showDate?: boolean
}

export function AlarmArticle({alarm, showDate = false}: AlarmArticleProps) {
  const paragraphs = alarm.body.split('\n\n').filter(Boolean)

  return (
    <article>
      {showDate ? (
        <p
          className="text-[var(--brass)]"
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            fontVariant: 'small-caps',
          }}
        >
          {formatSwedishDate(alarm.date)}
        </p>
      ) : null}

      <p
        className="mt-3 uppercase tracking-[0.16em] text-[var(--brass)]"
        style={{fontSize: 11}}
      >
        {alarm.kicker}
      </p>

      <h1 className="mt-3 font-serif text-[1.55rem] leading-[1.2] text-[var(--ink)] sm:text-[2rem] lg:mt-4 lg:text-[2.5rem]">
        {alarm.headline}
      </h1>

      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="mt-4 leading-[1.7] text-[var(--ink-muted)] lg:mt-5 lg:text-[1.125rem] lg:leading-8"
        >
          {paragraph}
        </p>
      ))}

      <aside className="mt-8 border-l-2 border-[var(--brass)] pl-4 lg:mt-12 lg:pl-5">
        <p
          className="uppercase tracking-[0.16em] text-[var(--brass)]"
          style={{fontSize: 11}}
        >
          {alarm.expertVoice} {alarm.expertHeadline}
        </p>
        <p className="mt-3 italic leading-[1.7] text-[var(--brass)] lg:text-[1.125rem] lg:leading-8">
          {alarm.expertText}
        </p>
      </aside>

      <p className="mt-6 text-xs leading-relaxed text-[var(--ink-muted)] lg:mt-8 lg:text-sm">
        <span className="block">
          Ursprungligen {alarm.sourceNewspaper}, {formatSwedishDateShort(alarm.date)}
        </span>
        {'"'}
        <a
          href={alarm.sourceAlarmindexUrl}
          rel="noreferrer"
          target="_blank"
          className="text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-2 hover:text-[var(--ink)]"
        >
          {alarm.sourceHeadline}
        </a>
        {'"'}
      </p>
    </article>
  )
}
