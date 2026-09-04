import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <h1 className="font-serif text-[1.65rem] leading-tight text-[var(--ink)] sm:text-[2rem] lg:text-[2.5rem]">
        Sidan finns inte
      </h1>
      <p className="mt-4 leading-relaxed text-[var(--ink-muted)]">
        Hönan har inte värpt hit.
      </p>
      <p className="mt-8">
        <Link href="/" className="text-[var(--brass)]">
          Till dagens nummer
        </Link>
      </p>
    </div>
  )
}
