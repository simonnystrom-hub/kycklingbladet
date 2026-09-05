import type {Metadata} from 'next'
import Link from 'next/link'
import {PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED} from '@/lib/privacy'

export const metadata: Metadata = {
  title: 'Integritet',
  description:
    'Integritetspolicy för Kycklingbladet: hur vi behandlar personuppgifter enligt GDPR och hur du kontaktar oss.',
  alternates: {canonical: '/integritet'},
}

const prose = 'mt-4 leading-relaxed text-[var(--ink-muted)] lg:mt-5 lg:text-[1.125rem] lg:leading-8'

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:text-[2rem] lg:text-[2.5rem]">
        Integritetspolicy
      </h1>
      <p className="mt-3 text-sm text-[var(--brass)] lg:mt-4">
        Senast uppdaterad {PRIVACY_UPDATED}
      </p>
      <p className={prose}>{PRIVACY_INTRO}</p>

      {PRIVACY_SECTIONS.map((section) => (
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
          Kontakt
        </h2>
        <p className={prose}>
          Använd{' '}
          <Link
            href="/kontakt"
            className="text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-2"
          >
            kontaktsidan
          </Link>{' '}
          för frågor om personuppgifter, denna policy och för att utöva dina rättigheter enligt GDPR.
        </p>
      </section>
    </article>
  )
}
