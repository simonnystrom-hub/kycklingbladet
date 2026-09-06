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
      <div className={`${SHELL} pt-[max(1.25rem,env(safe-area-inset-top))] sm:pt-6 lg:pt-8`}>
        <SiteNav className="mb-4 text-center sm:mb-6 lg:mb-8" />
        <div className="pb-4 lg:pb-5" style={{borderBottom: '1px solid var(--brass)'}}>
          <div className="flex items-center justify-between gap-3 sm:items-end sm:gap-4 lg:gap-6">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2.5 text-[var(--ink)] hover:text-[var(--brass)] sm:items-end sm:gap-3 lg:gap-4"
            >
              <Image
                src="/logo.png"
                alt=""
                width={88}
                height={88}
                priority
                className="size-12 shrink-0 rounded-sm sm:size-[4.5rem] lg:size-[5.5rem]"
              />
              <span className="min-w-0">
                <span className="block font-serif text-[1.5rem] italic leading-none sm:whitespace-nowrap sm:text-[2rem] lg:text-[2.75rem]">
                  Kycklingbladet
                </span>
                <p
                  className="mt-2 hidden text-[11px] leading-snug tracking-[0.08em] text-[var(--ink-muted)] sm:block lg:mt-3 lg:text-xs lg:tracking-[0.12em]"
                  style={{fontVariant: 'small-caps'}}
                >
                  {tagline}
                </p>
              </span>
            </Link>
            <FacebookFollow />
          </div>
          <p
            className="mt-2.5 line-clamp-2 text-[10px] leading-snug tracking-[0.04em] text-[var(--ink-muted)] sm:hidden"
            style={{fontVariant: 'small-caps'}}
          >
            {tagline}
          </p>
        </div>
      </div>
    </header>
  )
}
