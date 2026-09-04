import Link from 'next/link'

type IssueNavProps = {
  previous: string | null
  next: string | null
}

export function IssueNav({previous, next}: IssueNavProps) {
  if (!previous && !next) return null

  return (
    <nav
      className="mt-10 flex items-center justify-between gap-x-4 border-t border-[var(--rule)] pt-3 sm:mt-12 lg:mt-16 lg:pt-6"
    >
      {previous ? (
        <Link href={`/arkiv/${previous}`} className="inline-flex min-h-11 items-center text-[var(--brass)]">
          « Föregående dag
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/arkiv/${next}`} className="inline-flex min-h-11 items-center text-[var(--brass)]">
          Nästa dag »
        </Link>
      ) : null}
    </nav>
  )
}
