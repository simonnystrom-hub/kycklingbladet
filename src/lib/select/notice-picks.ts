import type {ScoredHeadline} from '@/lib/select/select-winner'

export const NOTICE_COUNT = 2

export type LeadSource = {
  sourceHeadline: string
  sourceNewspaperSlug: string
  sourceHeadlineId?: string | null
}

export function isLeadHeadline(headline: ScoredHeadline, lead: LeadSource): boolean {
  if (lead.sourceHeadlineId && headline.headlineId === lead.sourceHeadlineId) return true
  return (
    headline.newspaperSlug === lead.sourceNewspaperSlug &&
    headline.text === lead.sourceHeadline
  )
}

export type UsedNoticeSource = {
  sourceHeadline: string
  sourceNewspaperSlug: string
  sourceHeadlineId?: string | null
}

export function remainingHeadlines(
  headlines: ScoredHeadline[],
  lead: LeadSource,
  used: UsedNoticeSource[] = [],
): ScoredHeadline[] {
  return headlines.filter(
    (headline) => !isLeadHeadline(headline, lead) && !isUsedHeadline(headline, used),
  )
}

export function isUsedHeadline(headline: ScoredHeadline, used: UsedNoticeSource[]): boolean {
  return used.some((notice) => {
    if (notice.sourceHeadlineId && headline.headlineId === notice.sourceHeadlineId) return true
    return (
      headline.newspaperSlug === notice.sourceNewspaperSlug &&
      headline.text === notice.sourceHeadline
    )
  })
}

export function sanitizePickedIds(
  picked: string[],
  pool: ScoredHeadline[],
  limit = NOTICE_COUNT,
): string[] {
  const allowed = new Set(pool.map((headline) => headline.headlineId))
  const unique: string[] = []
  for (const id of picked) {
    if (!allowed.has(id)) continue
    if (unique.includes(id)) continue
    unique.push(id)
    if (unique.length >= limit) break
  }
  return unique
}
