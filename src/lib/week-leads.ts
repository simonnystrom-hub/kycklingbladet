import {addIsoDays} from '@/lib/select/stockholm-date'

export const WEEK_LEAD_DAYS = 7
export const WEEK_LEAD_COUNT = 2

export type WeekLeadCandidate = {
  date: string
  humorScore?: number | null
}

export function weekLeadStart(today: string): string {
  return addIsoDays(today, -WEEK_LEAD_DAYS)
}

export function isInWeekLeadWindow(date: string, today: string): boolean {
  return date >= weekLeadStart(today) && date < today
}

export function pickWeekLeads<T extends WeekLeadCandidate>(
  items: T[],
  today: string,
  shownDate: string | null,
  count = WEEK_LEAD_COUNT,
): T[] {
  return items
    .filter((item) => isInWeekLeadWindow(item.date, today))
    .filter((item) => item.date !== shownDate)
    .filter((item) => typeof item.humorScore === 'number')
    .sort((a, b) => {
      const scoreDiff = (b.humorScore ?? 0) - (a.humorScore ?? 0)
      if (scoreDiff !== 0) return scoreDiff
      return a.date < b.date ? 1 : -1
    })
    .slice(0, count)
}
