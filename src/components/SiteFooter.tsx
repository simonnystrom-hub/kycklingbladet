import Link from 'next/link'
import {NAV_LINKS} from '@/lib/nav'

export function SiteFooter() {
  return (
    <footer
      className="mt-auto w-full py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8"
      style={{borderTop: '1px solid var(--rule)'}}
    >
      <div className="mx-auto w-full max-w-[42rem] px-4 sm:px-5">
        <nav
          style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
            {NAV_LINKS.map(({href, label}) => (
              <li key={href}>
                <Link href={href} className="inline-block py-1.5 text-[var(--brass)]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
