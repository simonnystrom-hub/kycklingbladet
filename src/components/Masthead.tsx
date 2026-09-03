import Link from 'next/link'
import {DoomsdayClock} from '@/components/DoomsdayClock'
import {SiteNav} from '@/components/SiteNav'
import {getSiteSettings} from '@/lib/sanity/queries'

const FALLBACK_TAGLINE = 'Utkommer dagligen, mot bättre vetande'

export async function Masthead() {
  const settings = await getSiteSettings()
  const tagline = settings?.tagline?.trim() || FALLBACK_TAGLINE

  return (
    <header className="w-full px-5 pt-6">
      <SiteNav className="mb-6 text-center" />
      <div
        className="mx-auto flex w-full max-w-[42rem] items-end justify-between gap-4 pb-4"
        style={{borderBottom: '1px solid var(--brass)'}}
      >
        <div className="min-w-0">
          <Link
            href="/"
            className="block font-serif text-[2rem] italic leading-none text-[var(--ink)] hover:text-[var(--brass)]"
          >
            Kycklingbladet
          </Link>
          <p
            className="mt-2 text-[var(--ink-muted)]"
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              fontVariant: 'small-caps',
            }}
          >
            {tagline}
          </p>
        </div>
        <DoomsdayClock />
      </div>
    </header>
  )
}
