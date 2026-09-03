import type {Metadata, Viewport} from 'next'
import {Source_Serif_4} from 'next/font/google'
import {Masthead} from '@/components/Masthead'
import {SiteFooter} from '@/components/SiteFooter'
import {getSiteSettings} from '@/lib/sanity/queries'
import './globals.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-serif',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#14110c',
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
        <main className="mx-auto w-full max-w-[42rem] flex-1 px-5 py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
