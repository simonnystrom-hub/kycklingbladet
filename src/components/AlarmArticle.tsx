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

      <h1 className="mt-3 font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:text-[2rem]">
        {alarm.headline}
      </h1>

      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="mt-4 leading-relaxed text-[var(--ink-muted)]"
        >
          {paragraph}
        </p>
      ))}

      <aside
        className="mt-8"
        style={{borderTop: '1px solid var(--rule)', paddingTop: '1.25rem'}}
      >
        <p
          className="uppercase tracking-[0.16em] text-[var(--brass)]"
          style={{fontSize: 11}}
        >
          {alarm.expertVoice} {alarm.expertHeadline}
        </p>
        <p className="mt-3 italic leading-relaxed text-[var(--brass)]">
          {alarm.expertText}
        </p>
      </aside>

      <p className="mt-6 text-sm leading-relaxed text-[var(--ink-muted)]">
        Ursprungligen {alarm.sourceNewspaper}, {formatSwedishDateShort(alarm.date)}
        {' · «'}
        <a
          href={alarm.sourceAlarmindexUrl}
          rel="noreferrer"
          target="_blank"
          className="text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-2 hover:text-[var(--ink)]"
        >{alarm.sourceHeadline}</a>
        {'»'}
      </p>
    </article>
  )
}
