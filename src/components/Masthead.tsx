import Image from 'next/image'
import Link from 'next/link'
import {DoomsdayClock} from '@/components/DoomsdayClock'
import {SiteNav} from '@/components/SiteNav'
import {TAGLINE} from '@/lib/copy'
import {getSiteSettings} from '@/lib/sanity/queries'

export async function Masthead() {
  const settings = await getSiteSettings()
  const tagline = settings?.tagline?.trim() || TAGLINE

  return (
    <header className="w-full">
      <div className="mx-auto w-full max-w-[42rem] px-4 pt-5 sm:px-5 sm:pt-6">
        <SiteNav className="mb-5 text-center sm:mb-6" />
        <div style={{borderBottom: '1px solid var(--brass)'}} className="pb-4">
          <div className="flex items-end justify-between gap-2 sm:gap-4">
            <Link
              href="/"
              className="flex min-w-0 items-end gap-2 text-[var(--ink)] hover:text-[var(--brass)] sm:gap-3"
            >
              <Image
                src="/logo.png"
                alt=""
                width={72}
                height={72}
                priority
                className="size-10 shrink-0 rounded-sm sm:size-[4.5rem]"
              />
              <span className="whitespace-nowrap font-serif text-[1.35rem] italic leading-none min-[360px]:text-[1.5rem] sm:text-[2rem]">
                Kycklingbladet
              </span>
            </Link>
            <DoomsdayClock />
          </div>
          <p
            className="mt-2 leading-snug text-[var(--ink-muted)]"
            style={{
              fontSize: 11,
              letterSpacing: '0.06em',
              fontVariant: 'small-caps',
            }}
          >
            {tagline}
          </p>
        </div>
      </div>
    </header>
  )
}
