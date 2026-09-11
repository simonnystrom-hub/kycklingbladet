export type VisdomsordRow = {
  _id: string
  quote: string
  henName: string
  usedDate?: string | null
  imageUrl?: string | null
  queueOrder?: number | null
  _createdAt: string
}

export function alreadyPostedOn(rows: VisdomsordRow[], date: string): boolean {
  return rows.some((row) => row.usedDate === date)
}

export function compareVisdomsordQueue(
  a: Pick<VisdomsordRow, 'queueOrder' | '_createdAt'>,
  b: Pick<VisdomsordRow, 'queueOrder' | '_createdAt'>,
): number {
  const ao = typeof a.queueOrder === 'number' ? a.queueOrder : Number.POSITIVE_INFINITY
  const bo = typeof b.queueOrder === 'number' ? b.queueOrder : Number.POSITIVE_INFINITY
  if (ao !== bo) return ao - bo
  return a._createdAt.localeCompare(b._createdAt)
}

export function pickNextUnused(rows: VisdomsordRow[]): VisdomsordRow | null {
  const candidates = rows
    .filter((row) => !row.usedDate?.trim() && Boolean(row.quote.trim()))
    .sort(compareVisdomsordQueue)

  return candidates[0] ?? null
}
