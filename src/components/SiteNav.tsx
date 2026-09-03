'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

const LINKS = [
  {href: '/', label: 'Dagens nummer'},
  {href: '/arkiv', label: 'Arkiv'},
  {href: '/om', label: 'Om'},
] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteNav({className}: {className?: string}) {
  const pathname = usePathname()

  return (
    <nav
      className={className}
      style={{
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}
    >
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
        {LINKS.map(({href, label}) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={active ? 'text-[var(--ink)]' : 'text-[var(--brass)]'}
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
