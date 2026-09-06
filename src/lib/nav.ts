export const NAV_LINKS = [
  {href: '/', label: 'Dagens nyheter'},
  {href: '/arkiv', label: 'Arkiv'},
  {href: '/citat', label: 'Citat'},
  {href: '/om', label: 'Om'},
  {href: '/kontakt', label: 'Kontakt'},
] as const

export const ARCHIVE_PAGE_SIZE = 7

export function archivePageWindow(
  total: number,
  page: number,
  size = ARCHIVE_PAGE_SIZE,
): {current: number; pageCount: number; start: number} {
  const pageCount = Math.max(1, Math.ceil(total / size))
  const current = Math.min(Math.max(page, 1), pageCount)
  return {current, pageCount, start: (current - 1) * size}
}
