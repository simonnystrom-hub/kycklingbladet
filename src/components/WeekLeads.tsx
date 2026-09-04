import Link from 'next/link'
import type {AlarmTeaser} from '@/lib/sanity/types'
import {WEEK_LEADS_HEADING} from '@/lib/copy'
import {formatSwedishDate} from '@/lib/select/stockholm-date'
import {SectionHead} from '@/components/SectionHead'

export function WeekLeads({items, className}: {items: AlarmTeaser[]; className?: string}) {
  if (items.length === 0) return null

  return (
    <section className={className ?? 'mb-8 sm:mb-10 lg:mb-12'}>
      <SectionHead>{WEEK_LEADS_HEADING}</SectionHead>
      <ul className="grid gap-6 sm:grid-cols-2 sm:gap-0">
        {items.map((item, index) => (
          <li
            key={item._id}
            className={
              items.length < 2
                ? undefined
                : index === 0
                  ? 'sm:border-r sm:border-[var(--rule)] sm:pr-8'
                  : 'sm:pl-8'
            }
          >
            <Link href={`/arkiv/${item.date}`} className="group block py-2">
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
