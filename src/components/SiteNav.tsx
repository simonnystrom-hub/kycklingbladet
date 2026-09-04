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
      className={`text-[10px] tracking-[0.12em] uppercase lg:text-[11px] lg:tracking-[0.16em] ${className ?? ''}`}
    >
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-6 lg:gap-x-8">
        {NAV_LINKS.map(({href, label}) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={`inline-block py-1.5 lg:py-2 ${active ? 'text-[var(--ink)]' : 'text-[var(--brass)]'}`}
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
