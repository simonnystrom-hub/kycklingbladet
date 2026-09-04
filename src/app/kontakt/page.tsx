import {ContactForm} from '@/components/ContactForm'

export const metadata = {
  title: 'Kontakt',
}

export default function ContactPage() {
  return (
    <article>
      <h1 className="font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:text-[2rem]">
        Kontakt
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--ink-muted)]">
        Skriv till redet. Vi läser. Svar kommer när kacklet har lagt sig.
      </p>
      <ContactForm />
    </article>
  )
}
