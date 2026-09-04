import Link from 'next/link'
import type {AlarmTeaser} from '@/lib/sanity/types'
import {EMPTY_ARCHIVE} from '@/lib/copy'
import {formatSwedishDate} from '@/lib/select/stockholm-date'

type ArchiveListProps = {
  items: AlarmTeaser[]
}

export function ArchiveList({items}: ArchiveListProps) {
  if (items.length === 0) {
    return <p className="leading-relaxed text-[var(--ink-muted)]">{EMPTY_ARCHIVE}</p>
  }

  return (
    <ul className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
      {items.map((item) => (
        <li key={item._id}>
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
            <p
              className="mt-2 uppercase tracking-[0.16em] text-[var(--brass)]"
              style={{fontSize: 11}}
            >
              {item.kicker}
            </p>
            <p className="mt-2 font-serif text-[1.2rem] leading-snug text-[var(--ink)] group-hover:text-[var(--brass)] sm:text-xl lg:text-2xl">
              {item.headline}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
