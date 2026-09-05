import type {Metadata} from 'next'
import Link from 'next/link'
import {TERMS_INTRO, TERMS_SECTIONS, TERMS_UPDATED} from '@/lib/terms'

export const metadata: Metadata = {
  title: 'Villkor',
  description: 'Korta användarvillkor för Kycklingbladet, en gratissajt med satir.',
  alternates: {canonical: '/villkor'},
}

const prose = 'mt-4 leading-relaxed text-[var(--ink-muted)] lg:mt-5 lg:text-[1.125rem] lg:leading-8'
const linkClass =
  'text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-2'

export default function TermsPage() {
  return (
    <article>
      <h1 className="font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:text-[2rem] lg:text-[2.5rem]">
        Användarvillkor
      </h1>
      <p className="mt-3 text-sm text-[var(--brass)] lg:mt-4">
        Senast uppdaterad {TERMS_UPDATED}
      </p>
      <p className={prose}>{TERMS_INTRO}</p>

      {TERMS_SECTIONS.map((section) => (
        <section key={section.heading} className="mt-8 lg:mt-10">
          <h2 className="font-serif text-[1.25rem] leading-snug text-[var(--ink)] sm:text-[1.4rem] lg:text-[1.55rem]">
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${section.heading}-${index}`} className={prose}>
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <p className={prose}>
        <Link href="/integritet" className={linkClass}>
          Integritetspolicy
        </Link>
        {' · '}
        <Link href="/kontakt" className={linkClass}>
          Kontakt
        </Link>
      </p>
    </article>
  )
}
