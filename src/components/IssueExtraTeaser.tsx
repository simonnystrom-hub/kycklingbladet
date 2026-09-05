import Image from 'next/image'
import Link from 'next/link'
import {hasExtraExtra} from '@/lib/extra-extra/has-extra'
import {firstExtraParagraph} from '@/lib/extra-extra/first-paragraph'
import {extraIllustration} from '@/lib/extra-extra/illustration'
import {extraExtraPath} from '@/lib/extra-extra/path'
import {EXTRA_EXTRA_STAMP} from '@/lib/copy'
import type {ExtraExtra} from '@/lib/sanity/types'

export function IssueExtraTeaser({
  extra,
  date,
}: {
  extra?: ExtraExtra | null
  date: string
}) {
  if (!hasExtraExtra(extra)) return null

  const illustration = extraIllustration(extra)
  const lede = firstExtraParagraph(extra.body)

  return (
    <section
      className="mt-10 border-t border-[var(--rule)] pt-8 lg:mt-14 lg:pt-10"
      id="extra-extra"
    >
      <Link href={extraExtraPath(date)} className="group block">
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
        <h2 className="mt-3 font-serif text-[1.35rem] leading-snug text-[var(--ink)] group-hover:text-[var(--brass)] sm:text-[1.5rem] lg:text-[1.7rem]">
          {extra.headline}
        </h2>
        {lede ? (
          <p className="mt-3 leading-[1.7] text-[var(--ink-muted)]">{lede}</p>
        ) : null}
        {illustration ? (
          <figure className="mt-5">
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
        ) : null}
      </Link>
    </section>
  )
}
