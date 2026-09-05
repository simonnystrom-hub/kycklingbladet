import type {Metadata} from 'next'
import {ABOUT} from '@/lib/copy'
import {getSiteSettings} from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'Om',
  alternates: {canonical: '/om'},
}

export const revalidate = 60

function splitParagraphs(text: string): string[] {
  return text.split('\n\n').filter(Boolean)
}

export default async function AboutPage() {
  const settings = await getSiteSettings()
  const about = settings?.about?.trim() || ABOUT
  const alarmindexMention = settings?.alarmindexMention?.trim() ?? ''

  return (
    <article>
      <h1 className="font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:text-[2rem] lg:text-[2.5rem]">
        Om Kycklingbladet
      </h1>

      {splitParagraphs(about).map((paragraph, index) => (
        <p
          key={`about-${index}`}
          className="mt-4 leading-relaxed text-[var(--ink-muted)] lg:mt-5 lg:text-[1.125rem] lg:leading-8"
        >
          {paragraph}
        </p>
      ))}

      {splitParagraphs(alarmindexMention).map((paragraph, index) => (
        <p
          key={`mention-${index}`}
          className="mt-4 leading-relaxed text-[var(--ink-muted)] lg:mt-5 lg:text-[1.125rem] lg:leading-8"
        >
          {paragraph}
        </p>
      ))}

      <p className="mt-6">
        <a
          href="https://alarmindex.com"
          rel="noreferrer"
          target="_blank"
          className="text-[var(--brass)]"
        >
          Alarmindex
        </a>
      </p>
    </article>
  )
}
