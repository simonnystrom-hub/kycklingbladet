import Link from 'next/link'

type IssueNavProps = {
  previousHref: string | null
  nextHref: string | null
  previousLabel?: string
  nextLabel?: string
}

export function IssueNav({
  previousHref,
  nextHref,
  previousLabel = '« Föregående dag',
  nextLabel = 'Nästa dag »',
}: IssueNavProps) {
  if (!previousHref && !nextHref) return null

  return (
    <nav
      className="mt-10 flex items-center justify-between gap-x-4 border-t border-[var(--rule)] pt-3 sm:mt-12 lg:mt-16 lg:pt-6"
    >
      {previousHref ? (
        <Link href={previousHref} className="inline-flex min-h-11 items-center text-[var(--brass)]">
          {previousLabel}
        </Link>
      ) : (
        <span />
      )}
      {nextHref ? (
        <Link href={nextHref} className="inline-flex min-h-11 items-center text-[var(--brass)]">
          {nextLabel}
        </Link>
      ) : null}
    </nav>
  )
}
