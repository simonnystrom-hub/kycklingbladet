import Image from 'next/image'
import {EXTRA_EXTRA_STAMP} from '@/lib/copy'
import {hasExtraExtra} from '@/lib/extra-extra/has-extra'
import {extraIllustration} from '@/lib/extra-extra/illustration'
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

  const illustration = extraIllustration(extra)
  const paragraphs = extra.body.split('\n\n').filter(Boolean).map((paragraph, index) => (
    <p
      key={index}
      className="mt-3 leading-[1.7] text-[var(--ink-muted)]"
    >
      {paragraph}
    </p>
  ))

  const source = (
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
  )

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
        {EXTRA_EXTRA_STAMP}
      </p>
      <h2 className="mt-3 font-serif text-[1.35rem] leading-snug text-[var(--ink)] sm:text-[1.5rem] lg:text-[1.7rem]">
        {extra.headline}
      </h2>
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
            {source}
          </div>
        </div>
      ) : (
        <>
          {paragraphs}
          {source}
        </>
      )}
    </section>
  )
}
