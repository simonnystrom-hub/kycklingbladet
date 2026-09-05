import type {Metadata} from 'next'
import Link from 'next/link'
import {DELETION_INTRO, DELETION_SECTIONS, DELETION_UPDATED} from '@/lib/deletion'

export const metadata: Metadata = {
  title: 'Radering av uppgifter',
  description:
    'Så begär du att Kycklingbladet raderar personuppgifter. Data deletion instructions för Meta-appen.',
  alternates: {canonical: '/radering'},
}

const prose = 'mt-4 leading-relaxed text-[var(--ink-muted)] lg:mt-5 lg:text-[1.125rem] lg:leading-8'
const linkClass =
  'text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-2'

export default function DeletionPage() {
  return (
    <article>
      <h1 className="font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:text-[2rem] lg:text-[2.5rem]">
        Radering av personuppgifter
      </h1>
      <p className="mt-3 text-sm text-[var(--brass)] lg:mt-4">
        Senast uppdaterad {DELETION_UPDATED}
      </p>
      <p className={prose}>{DELETION_INTRO}</p>

      {DELETION_SECTIONS.map((section) => (
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

      <section className="mt-8 lg:mt-10">
        <h2 className="font-serif text-[1.25rem] leading-snug text-[var(--ink)] sm:text-[1.4rem] lg:text-[1.55rem]">
          Skicka begäran
        </h2>
        <p className={prose}>
          Använd{' '}
          <Link href="/kontakt" className={linkClass}>kontaktsidan</Link>. Mer
          om hur vi behandlar uppgifter finns i{' '}
          <Link href="/integritet" className={linkClass}>integritetspolicyn</Link>.
        </p>
      </section>
    </article>
  )
}
