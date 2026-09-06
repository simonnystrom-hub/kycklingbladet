import Image from 'next/image'
import {EMPTY_CITAT} from '@/lib/copy'
import type {VisdomsordQuote} from '@/lib/sanity/types'

export function CitatList({quotes}: {quotes: VisdomsordQuote[]}) {
  const published = quotes.filter((quote) => quote.imageUrl?.trim())
  if (published.length === 0) {
    return <p className="leading-relaxed text-[var(--ink-muted)]">{EMPTY_CITAT}</p>
  }

  return (
    <div>
      {published.map((item) => {
        const caption = item.imageCaption?.trim() || item.quote
        return (
          <article
            key={item._id}
            className="border-b border-[var(--rule)] py-8 last:border-b-0 sm:py-10 lg:py-12"
          >
            <blockquote className="font-serif text-[1.35rem] leading-snug text-[var(--ink)] sm:text-[1.5rem] lg:text-[1.7rem]">
              {item.quote}
            </blockquote>
            <p
              className="mt-3 uppercase tracking-[0.16em] text-[var(--brass)]"
              style={{fontSize: 11}}
            >
              {item.henName}
            </p>
            <figure className="mt-5 max-w-xl">
              <div className="border border-[var(--rule)] bg-[#f3ead6] p-2">
                <Image
                  src={item.imageUrl}
                  alt={caption}
                  width={768}
                  height={1024}
                  sizes="(min-width: 640px) 36rem, 100vw"
                  className="h-auto w-full"
                />
              </div>
              {item.imageCaption?.trim() ? (
                <figcaption className="mt-2 text-xs italic leading-relaxed text-[var(--brass)] lg:text-sm">
                  {item.imageCaption}
                </figcaption>
              ) : null}
            </figure>
          </article>
        )
      })}
    </div>
  )
}
