import Link from 'next/link'
import {FOOTER_DISCLAIMER} from '@/lib/copy'

const LINKS = [
  {href: '/', label: 'Dagens nummer'},
  {href: '/arkiv', label: 'Arkiv'},
  {href: '/om', label: 'Om'},
] as const

export function SiteFooter() {
  return (
    <footer
      className="mt-auto w-full px-5 py-8"
      style={{borderTop: '1px solid var(--rule)'}}
    >
      <div className="mx-auto w-full max-w-[42rem]">
        <nav
          className="mb-3"
          style={{
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {LINKS.map(({href, label}) => (
              <li key={href}>
                <Link href={href} className="text-[var(--brass)]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-[var(--ink-muted)]">{FOOTER_DISCLAIMER}</p>
      </div>
    </footer>
  )
}
