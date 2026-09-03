import {getSiteSettings} from '@/lib/sanity/queries'

export const revalidate = 60

const FALLBACK_ABOUT =
  'Kycklingbladet är en satirisk kvällstidning. Vi tar dagens mest uppblåsta rubrik och behandlar den som bokstavlig sanning. Inget av det som står här är nyhetsjournalistik.'

const FALLBACK_ALARMINDEX_MENTION =
  'Vilken rubrik som vinner dagen avgörs av siffror från Alarmindex, som mäter alarmistiskt formspråk i svenska löpsedlar. Kycklingbladet är inte Alarmindex. Vi är hönan som tar siffran på orden.'

function splitParagraphs(text: string): string[] {
  return text.split('\n\n').filter(Boolean)
}

export default async function AboutPage() {
  const settings = await getSiteSettings()
  const about = settings?.about?.trim() || FALLBACK_ABOUT
  const alarmindexMention =
    settings?.alarmindexMention?.trim() || FALLBACK_ALARMINDEX_MENTION

  return (
    <article>
      <h1 className="font-serif text-[2rem] leading-tight text-[var(--ink)]">
        Om Kycklingbladet
      </h1>

      {splitParagraphs(about).map((paragraph, index) => (
        <p
          key={`about-${index}`}
          className="mt-4 leading-relaxed text-[var(--ink-muted)]"
        >
          {paragraph}
        </p>
      ))}

      {splitParagraphs(alarmindexMention).map((paragraph, index) => (
        <p
          key={`mention-${index}`}
          className="mt-4 leading-relaxed text-[var(--ink-muted)]"
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
