import Link from 'next/link'
import type {AlarmTeaser} from '@/lib/sanity/types'
import {WEEK_LEADS_HEADING} from '@/lib/copy'
import {formatSwedishDate} from '@/lib/select/stockholm-date'

export function WeekLeads({items}: {items: AlarmTeaser[]}) {
  if (items.length === 0) return null

  return (
    <section className="mb-8 border-b border-[var(--brass)] pb-8 sm:mb-10 lg:mb-12 lg:pb-10">
      <h2
        className="text-[var(--brass)]"
        style={{
          fontSize: 11,
          letterSpacing: '0.12em',
          fontVariant: 'small-caps',
        }}
      >
        {WEEK_LEADS_HEADING}
      </h2>
      <ul className="mt-4 grid gap-6 sm:mt-5 sm:grid-cols-2 sm:gap-8">
        {items.map((item) => (
          <li key={item._id}>
            <Link href={`/arkiv/${item.date}`} className="group block py-1">
              <p
                className="text-[var(--brass)]"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  fontVariant: 'small-caps',
                }}
              >
                {formatSwedishDate(item.date)}
              </p>
              <p
                className="mt-2 uppercase tracking-[0.16em] text-[var(--brass)]"
                style={{fontSize: 11}}
              >
                {item.kicker}
              </p>
              <p className="mt-2 font-serif text-[1.2rem] leading-snug text-[var(--ink)] group-hover:text-[var(--brass)] sm:text-xl">
                {item.headline}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
