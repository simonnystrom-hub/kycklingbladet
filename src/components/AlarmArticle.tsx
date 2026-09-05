import Image from 'next/image'
import {leadIllustration} from '@/lib/extra-extra/illustration'
import type {Alarm} from '@/lib/sanity/types'
import {formatSwedishDate, formatSwedishDateShort} from '@/lib/select/stockholm-date'

type AlarmArticleProps = {
  alarm: Alarm
  showDate?: boolean
}

export function AlarmArticle({alarm, showDate = false}: AlarmArticleProps) {
  const illustration = leadIllustration(alarm)
  const paragraphs = alarm.body.split('\n\n').filter(Boolean).map((paragraph, index) => (
    <p
      key={index}
      className="mt-4 leading-[1.7] text-[var(--ink-muted)] lg:mt-5 lg:text-[1.125rem] lg:leading-8"
    >
      {paragraph}
    </p>
  ))

  const expert = (
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
  )

  const source = (
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
  )

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

      {illustration ? (
        <div className="lg:grid lg:grid-cols-[1fr_minmax(12rem,38%)] lg:gap-10 lg:items-start">
          <figure className="mt-5 lg:mt-0 lg:col-start-2 lg:row-span-2">
            <div className="border border-[var(--rule)] bg-[#f3ead6] p-2">
              <Image
                src={illustration.url}
                alt={illustration.caption}
                width={768}
                height={1024}
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-2 text-xs italic leading-relaxed text-[var(--brass)] lg:text-sm">
              {illustration.caption}
            </figcaption>
          </figure>
          <div className="lg:col-start-1 lg:row-start-1">
            {paragraphs}
            {expert}
            {source}
          </div>
        </div>
      ) : (
        <>
          {paragraphs}
          {expert}
          {source}
        </>
      )}
    </article>
  )
}
