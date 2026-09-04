import {ArchiveList} from '@/components/ArchiveList'
import {getAlarmArchivePage} from '@/lib/sanity/queries'
import Link from 'next/link'

export const revalidate = 60

type ArchivePageProps = {
  searchParams: Promise<{sida?: string}>
}

export default async function ArchivePage({searchParams}: ArchivePageProps) {
  const params = await searchParams
  const requested = Number.parseInt(params.sida ?? '1', 10)
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1
  const {items, page: current, pageCount} = await getAlarmArchivePage(page)

  return (
    <div>
      <h1 className="mb-8 font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:mb-10 sm:text-[2rem]">
        Arkiv
      </h1>
      <ArchiveList items={items} />
      {pageCount > 1 ? (
        <nav
          className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:mt-12"
          style={{borderTop: '1px solid var(--rule)', paddingTop: '1.25rem'}}
        >
          {current > 1 ? (
            <Link href={`/arkiv?sida=${current - 1}`} className="inline-block py-1.5 text-[var(--brass)]">
              « Nyare
            </Link>
          ) : (
            <span />
          )}
          <span
            className="text-[var(--ink-muted)]"
            style={{fontSize: 11, letterSpacing: '0.12em'}}
          >
            Sida {current} av {pageCount}
          </span>
          {current < pageCount ? (
            <Link href={`/arkiv?sida=${current + 1}`} className="inline-block py-1.5 text-[var(--brass)]">
              Äldre »
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  )
}
