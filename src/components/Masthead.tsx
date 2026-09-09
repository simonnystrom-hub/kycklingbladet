import Image from 'next/image'
import Link from 'next/link'
import {FacebookFollow} from '@/components/FacebookFollow'
import {SiteNav} from '@/components/SiteNav'
import {TAGLINE} from '@/lib/copy'
import {getSiteSettings} from '@/lib/sanity/queries'
import {SHELL} from '@/lib/shell'

export async function Masthead() {
  const settings = await getSiteSettings()
  const tagline = settings?.tagline?.trim() || TAGLINE

  return (
    <header className="w-full">
      <div
        className="relative h-44 w-full overflow-hidden sm:h-56 lg:h-72"
        style={{borderBottom: '2px solid var(--brass)'}}
      >
        <Image
          src="/cover.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_38%]"
        />
      </div>
      <div className={`${SHELL} pt-4 sm:pt-5`}>
        <div className="flex items-start justify-between gap-4 sm:items-center">
          <Link
            href="/"
            className="min-w-0 text-[var(--ink)] hover:text-[var(--brass)]"
          >
            <span className="block font-serif text-[1.65rem] font-bold leading-none sm:text-[2.15rem] lg:text-[2.6rem]">
              Kycklingbladet
            </span>
            <p
              className="mt-2 text-[10px] leading-snug tracking-[0.06em] text-[var(--ink-muted)] sm:text-[11px] sm:tracking-[0.08em] lg:mt-2.5 lg:text-xs lg:tracking-[0.1em]"
              style={{fontVariant: 'small-caps'}}
            >
              {tagline}
            </p>
          </Link>
          <FacebookFollow />
        </div>
        <SiteNav className="mt-4 border-y-2 border-[var(--brass)] py-1 text-center sm:mt-5 sm:py-1.5" />
      </div>
    </header>
  )
}
