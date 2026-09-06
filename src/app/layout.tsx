import type {Metadata, Viewport} from 'next'
import {Source_Serif_4} from 'next/font/google'
import {Analytics} from '@vercel/analytics/next'
import {Masthead} from '@/components/Masthead'
import {SiteFooter} from '@/components/SiteFooter'
import {TAGLINE} from '@/lib/copy'
import {DEFAULT_OG_IMAGE} from '@/lib/og'
import {RSS_FEED_PATH} from '@/lib/rss'
import {getSiteSettings} from '@/lib/sanity/queries'
import {SHELL} from '@/lib/shell'
import {getSiteUrl} from '@/lib/site-url'
import './globals.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-serif',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#14110c',
  viewportFit: 'cover',
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = settings?.title?.trim() || 'Kycklingbladet'
  const description = settings?.tagline?.trim() || TAGLINE
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: title,
      template: '%s — Kycklingbladet',
    },
    description,
    alternates: {
      types: {
        'application/rss+xml': RSS_FEED_PATH,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'sv_SE',
      siteName: 'Kycklingbladet',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="sv" className={`h-full ${sourceSerif.variable}`}>
      <body
        className={`${sourceSerif.className} flex min-h-full flex-col bg-[var(--bg)] text-[var(--ink)]`}
      >
        <Masthead />
        <main className={`${SHELL} flex-1 py-5 sm:py-10 lg:py-14`}>
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  )
}
