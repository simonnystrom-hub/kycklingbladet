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
        <nav className="text-[10px] tracking-[0.12em] uppercase lg:text-[11px] lg:tracking-[0.16em]">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6 lg:gap-x-8">
            {NAV_LINKS.map(({href, label}) => (
              <li key={href}>
                <Link href={href} className="inline-block py-1.5 text-[var(--brass)] lg:py-2">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/rss.xml" className="inline-block py-1.5 text-[var(--brass)] lg:py-2">
                RSS
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
