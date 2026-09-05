import type {Metadata} from 'next'
import Link from 'next/link'
import {ContactForm} from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Kontakt',
  alternates: {canonical: '/kontakt'},
}

export default function ContactPage() {
  return (
    <article>
      <h1 className="font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:text-[2rem] lg:text-[2.5rem]">
        Kontakt
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--ink-muted)] lg:mt-5 lg:text-[1.125rem] lg:leading-8">
        Skriv till redet. Vi läser. Svar kommer när kacklet har lagt sig. Hur vi
        behandlar personuppgifter står i{' '}
        <Link
          href="/integritet"
          className="text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-2"
        >
          integritetspolicyn
        </Link>.
      </p>
      <ContactForm />
    </article>
  )
}
