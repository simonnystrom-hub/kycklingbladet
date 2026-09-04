import type {Metadata, Viewport} from 'next'
import {Source_Serif_4} from 'next/font/google'
import {Masthead} from '@/components/Masthead'
import {SiteFooter} from '@/components/SiteFooter'
import {getSiteSettings} from '@/lib/sanity/queries'
import {SHELL} from '@/lib/shell'
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
  return {
    title: {
      default: settings?.title?.trim() || 'Kycklingbladet',
      template: '%s — Kycklingbladet',
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
        <main className={`${SHELL} flex-1 py-6 sm:py-10 lg:py-14`}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
