import type {Alarm} from '@/lib/sanity/types'
import {formatSwedishDate} from '@/lib/select/stockholm-date'

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

      <h1 className="mt-3 font-serif text-[2rem] leading-tight text-[var(--ink)]">
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

      <p
        className="mt-8 italic text-[var(--brass)]"
        style={{borderTop: '1px solid var(--rule)', paddingTop: '1.25rem'}}
      >
        Överlevnadstips: {alarm.survivalTip}
      </p>

      <p className="mt-6 text-sm text-[var(--ink-muted)]">
        Ursprungligen {alarm.sourceNewspaper} · «{alarm.sourceHeadline}» ·{' '}
        <a
          href={alarm.sourceAlarmindexUrl}
          rel="noreferrer"
          target="_blank"
          className="text-[var(--ink-muted)] underline decoration-[var(--rule)] underline-offset-2 hover:text-[var(--brass)]"
        >
          Alarmindex
        </a>
      </p>
    </article>
  )
}
