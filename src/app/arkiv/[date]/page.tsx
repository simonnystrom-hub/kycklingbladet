import Link from 'next/link'
import {notFound} from 'next/navigation'
import {AlarmArticle} from '@/components/AlarmArticle'
import {getAdjacentDates, getAlarmByDate} from '@/lib/sanity/queries'

export const revalidate = 60

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

type ArchiveDatePageProps = {
  params: Promise<{date: string}>
}

export default async function ArchiveDatePage({params}: ArchiveDatePageProps) {
  const {date} = await params

  if (!DATE_RE.test(date)) {
    notFound()
  }

  const alarm = await getAlarmByDate(date)
  if (!alarm) {
    notFound()
  }

  const {previous, next} = await getAdjacentDates(date)

  return (
    <div>
      <AlarmArticle alarm={alarm} showDate />
      {(previous || next) && (
        <nav
          className="mt-12 flex flex-wrap items-center justify-between gap-4"
          style={{borderTop: '1px solid var(--rule)', paddingTop: '1.25rem'}}
        >
          {previous ? (
            <Link
              href={`/arkiv/${previous}`}
              className="text-[var(--brass)]"
            >
              « Föregående dag
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/arkiv/${next}`} className="text-[var(--brass)]">
              Nästa dag »
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  )
}
