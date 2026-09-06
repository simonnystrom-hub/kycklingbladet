import Anthropic from '@anthropic-ai/sdk'
import {resolveModel} from '@/lib/generate/claude'
import {normalizeQuoteKey} from './normalize'
import {parseVisdomsordDrafts, type VisdomsordDraft} from './parse'
import {buildVisdomsordUserPrompt, VISDOMSORD_SYSTEM_PROMPT} from './prompt'

export function takeFreshDrafts(
  drafts: VisdomsordDraft[],
  existingKeys: Set<string>,
): VisdomsordDraft[] {
  const seen = new Set(existingKeys)
  const fresh: VisdomsordDraft[] = []

  for (const draft of drafts) {
    const quote = draft.quote.trim()
    const henName = draft.henName.trim()
    const key = normalizeQuoteKey(quote)
    if (!quote || !henName || !key || seen.has(key)) continue

    seen.add(key)
    fresh.push({quote, henName})
  }

  return fresh
}

export async function generateVisdomsordDrafts(input: {
  count: number
  existingQuotes: string[]
}): Promise<VisdomsordDraft[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY saknas')

  const targetCount = Math.max(0, Math.floor(input.count))
  const anthropic = new Anthropic({apiKey})
  const model = resolveModel()
  const existingKeys = input.existingQuotes.map(normalizeQuoteKey).filter(Boolean)
  const knownKeys = new Set(existingKeys)
  const accepted: VisdomsordDraft[] = []
  const acceptedKeys: string[] = []

  while (accepted.length < targetCount) {
    const batchCount = Math.min(25, targetCount - accepted.length)
    const call = async () => {
      const message = await anthropic.messages.create({
        model,
        max_tokens: 4000,
        temperature: 0.9,
        system: VISDOMSORD_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildVisdomsordUserPrompt({
              count: batchCount,
              existingKeys,
              acceptedKeys,
            }),
          },
        ],
      })
      const text = message.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('\n')
      return parseVisdomsordDrafts(text)
    }

    let parsed = await call()
    if (parsed.length === 0) parsed = await call()
    if (parsed.length === 0) break

    const fresh = takeFreshDrafts(parsed, knownKeys).slice(0, batchCount)
    if (fresh.length === 0) break

    for (const draft of fresh) {
      const key = normalizeQuoteKey(draft.quote)
      knownKeys.add(key)
      acceptedKeys.push(key)
      accepted.push(draft)
    }
  }

  return accepted
}
