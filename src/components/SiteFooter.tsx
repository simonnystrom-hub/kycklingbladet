import Link from 'next/link'
import {NAV_LINKS} from '@/lib/nav'
import {SHELL} from '@/lib/shell'

export function SiteFooter() {
  return (
    <footer
      className="mt-auto w-full py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8 lg:py-10"
      style={{borderTop: '1px solid var(--rule)'}}
    >
      <div className={SHELL}>
        <nav className="text-[11px] tracking-[0.12em] uppercase lg:tracking-[0.16em]">
          <ul className="flex flex-wrap items-center gap-x-3 sm:gap-x-6 lg:gap-x-8">
            {NAV_LINKS.map(({href, label}) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-11 items-center text-[var(--brass)]">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/rss.xml" className="inline-flex min-h-11 items-center text-[var(--brass)]">
                RSS
              </a>
            </li>
            <li>
              <Link href="/integritet" className="inline-flex min-h-11 items-center text-[var(--brass)]">
                Integritet
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
