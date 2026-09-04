'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {NAV_LINKS} from '@/lib/nav'

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteNav({className}: {className?: string}) {
  const pathname = usePathname()

  return (
    <nav
      className={`text-[11px] tracking-[0.12em] uppercase lg:tracking-[0.16em] ${className ?? ''}`}
    >
      <ul className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-6 lg:gap-x-8">
        {NAV_LINKS.map(({href, label}) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={`inline-flex min-h-11 items-center py-2 ${
                  active
                    ? 'text-[var(--ink)] underline decoration-[var(--brass)] underline-offset-4'
                    : 'text-[var(--brass)]'
                }`}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
