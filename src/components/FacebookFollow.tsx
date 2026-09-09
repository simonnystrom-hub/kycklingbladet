import {FACEBOOK_PAGE_LABEL, FACEBOOK_PAGE_URL} from '@/lib/copy'

export function FacebookFollow() {
  return (
    <a
      href={FACEBOOK_PAGE_URL}
      rel="noreferrer"
      target="_blank"
      aria-label={FACEBOOK_PAGE_LABEL}
      className="flex shrink-0 items-center gap-2 text-[var(--brass)] hover:text-[var(--ink)]"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-8 w-8 sm:h-9 sm:w-9"
      >
        <path
          fill="currentColor"
          d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"
        />
      </svg>
      <span className="hidden font-serif text-[11px] italic leading-tight tracking-[0.06em] sm:block">
        Följ oss
        <br />
        på Facebook
      </span>
    </a>
  )
}
