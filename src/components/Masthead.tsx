import Image from 'next/image'
import Link from 'next/link'
import {DoomsdayClock} from '@/components/DoomsdayClock'
import {SiteNav} from '@/components/SiteNav'
import {TAGLINE} from '@/lib/copy'
import {getSiteSettings} from '@/lib/sanity/queries'
import {SHELL} from '@/lib/shell'

export async function Masthead() {
  const settings = await getSiteSettings()
  const tagline = settings?.tagline?.trim() || TAGLINE

  return (
    <header className="w-full">
      <div className={`${SHELL} pt-5 sm:pt-6 lg:pt-8`}>
        <SiteNav className="mb-5 text-center sm:mb-6 lg:mb-8" />
        <div className="pb-4 lg:pb-5" style={{borderBottom: '1px solid var(--brass)'}}>
          <div className="flex items-end justify-between gap-2 sm:gap-4 lg:gap-6">
            <Link
              href="/"
              className="flex min-w-0 items-end gap-2 text-[var(--ink)] hover:text-[var(--brass)] sm:gap-3 lg:gap-4"
            >
              <Image
                src="/logo.png"
                alt=""
                width={88}
                height={88}
                priority
                className="size-10 shrink-0 rounded-sm sm:size-[4.5rem] lg:size-[5.5rem]"
              />
              <span className="min-w-0">
                <span className="block whitespace-nowrap font-serif text-[1.35rem] italic leading-none min-[360px]:text-[1.5rem] sm:text-[2rem] lg:text-[2.75rem]">
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
            <DoomsdayClock />
          </div>
          <p
            className="mt-2 text-[11px] leading-snug tracking-[0.06em] text-[var(--ink-muted)] sm:hidden"
            style={{fontVariant: 'small-caps'}}
          >
            {tagline}
          </p>
        </div>
      </div>
    </header>
  )
}
