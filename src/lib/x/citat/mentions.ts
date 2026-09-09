const HANDLE = /^@?[A-Za-z0-9_]{1,15}$/

export function normalizeMentions(raw: string, sourceUsername?: string | null): string[] {
  const skip = sourceUsername?.replace(/^@/, '').toLowerCase() ?? ''
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(/[\s,]+/)) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const core = trimmed.replace(/^@+/, '')
    if (!HANDLE.test(core)) continue
    const key = core.toLowerCase()
    if (key === skip || seen.has(key)) continue
    seen.add(key)
    out.push(`@${core}`)
  }
  return out
}

export function appendMentions(text: string, mentions: string[]): string {
  const body = text.trim()
  if (mentions.length === 0) return body
  return `${body}\n\n${mentions.join(' ')}`
}
