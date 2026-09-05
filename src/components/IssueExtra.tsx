import {hasExtraExtra} from '@/lib/extra-extra/has-extra'
import type {ExtraExtra} from '@/lib/sanity/types'
import {formatSwedishDateShort} from '@/lib/select/stockholm-date'

export function IssueExtra({
  extra,
  date,
}: {
  extra?: ExtraExtra | null
  date: string
}) {
  if (!hasExtraExtra(extra)) return null

  const paragraphs = extra.body.split('\n\n').filter(Boolean)

  return (
    <section
      className="mt-10 border-t border-[var(--rule)] pt-8 lg:mt-14 lg:pt-10"
      id="extra-extra"
    >
      <p
        className="text-[var(--brass)]"
        style={{
          fontSize: 12,
          letterSpacing: '0.22em',
          fontVariant: 'small-caps',
        }}
      >
        EXTRA EXTRA
      </p>
      <h2 className="mt-3 font-serif text-[1.35rem] leading-snug text-[var(--ink)] sm:text-[1.5rem] lg:text-[1.7rem]">
        {extra.headline}
      </h2>
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="mt-3 leading-[1.7] text-[var(--ink-muted)]"
        >
          {paragraph}
        </p>
      ))}
      <p className="mt-3 text-xs leading-relaxed text-[var(--ink-muted)] lg:text-sm">
        <span className="block">
          Ursprungligen {extra.sourceNewspaper}, {formatSwedishDateShort(date)}
        </span>
        {'"'}
        <a
          href={extra.sourceUrl}
          rel="noreferrer"
          target="_blank"
          className="text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-2 hover:text-[var(--ink)]"
        >
          {extra.sourceHeadline}
        </a>
        {'"'}
      </p>
    </section>
  )
}
