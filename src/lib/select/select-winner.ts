export type ScoredHeadline = {
  headlineId: string
  text: string
  newspaperName: string
  newspaperSlug: string
  displayScore: number
}

export function selectWinner(headlines: ScoredHeadline[]): ScoredHeadline | null {
  if (headlines.length === 0) return null
  return [...headlines].sort((a, b) => {
    if (b.displayScore !== a.displayScore) return b.displayScore - a.displayScore
    const slug = a.newspaperSlug.localeCompare(b.newspaperSlug)
    if (slug !== 0) return slug
    return a.headlineId.localeCompare(b.headlineId)
  })[0]
}
