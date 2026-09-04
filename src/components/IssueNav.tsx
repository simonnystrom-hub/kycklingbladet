import Link from 'next/link'

type IssueNavProps = {
  previous: string | null
  next: string | null
}

export function IssueNav({previous, next}: IssueNavProps) {
  if (!previous && !next) return null

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-[var(--rule)] pt-5 sm:mt-12 lg:mt-16 lg:pt-6"
    >
      {previous ? (
        <Link href={`/arkiv/${previous}`} className="inline-block py-1.5 text-[var(--brass)]">
          « Föregående dag
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/arkiv/${next}`} className="inline-block py-1.5 text-[var(--brass)]">
          Nästa dag »
        </Link>
      ) : null}
    </nav>
  )
}
