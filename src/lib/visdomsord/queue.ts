export type VisdomsordRow = {
  _id: string
  quote: string
  henName: string
  usedDate?: string | null
  imageUrl?: string | null
  _createdAt: string
}

export function alreadyPostedOn(rows: VisdomsordRow[], date: string): boolean {
  return rows.some((row) => row.usedDate === date)
}

export function pickNextUnusedWithImage(rows: VisdomsordRow[]): VisdomsordRow | null {
  const candidates = rows
    .filter((row) => !row.usedDate?.trim() && Boolean(row.imageUrl?.trim()))
    .sort((a, b) => a._createdAt.localeCompare(b._createdAt))

  return candidates[0] ?? null
}
