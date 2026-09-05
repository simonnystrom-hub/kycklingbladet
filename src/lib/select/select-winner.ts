import {addIsoDays} from '@/lib/select/stockholm-date'

export const LEAD_LOOKBACK_DAYS = 7

export type ScoredHeadline = {
  headlineId: string
  text: string
  newspaperName: string
  newspaperSlug: string
  displayScore: number
  newspaperDailyScore: number
}

export type UsedLeadSource = {
  sourceHeadline: string
  sourceNewspaperSlug: string
  sourceHeadlineId?: string | null
}

export function recentLeadWindow(
  date: string,
  days = LEAD_LOOKBACK_DAYS,
): {start: string; before: string} {
  return {start: addIsoDays(date, -days), before: date}
}

export function rankHeadlines(headlines: ScoredHeadline[]): ScoredHeadline[] {
  return [...headlines].sort((a, b) => {
    if (b.displayScore !== a.displayScore) return b.displayScore - a.displayScore
    const slug = a.newspaperSlug.localeCompare(b.newspaperSlug)
    if (slug !== 0) return slug
    return a.headlineId.localeCompare(b.headlineId)
  })
}

export function isUsedLead(headline: ScoredHeadline, used: UsedLeadSource[]): boolean {
  return used.some((lead) => {
    if (lead.sourceHeadlineId && headline.headlineId === lead.sourceHeadlineId) return true
    return (
      headline.newspaperSlug === lead.sourceNewspaperSlug &&
      headline.text === lead.sourceHeadline
    )
  })
}

export function selectWinner(
  headlines: ScoredHeadline[],
  used: UsedLeadSource[] = [],
): ScoredHeadline | null {
  return rankHeadlines(headlines).find((headline) => !isUsedLead(headline, used)) ?? null
}
