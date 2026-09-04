import Anthropic from '@anthropic-ai/sdk'
import {parseGeneratedAlarm} from './parse'
import {
  NOTICE_PICK_SYSTEM,
  NOTICE_WRITE_SYSTEM,
  buildNoticePickUserPrompt,
  buildNoticeWriteUserPrompt,
} from './notice-prompt'
import {validateGeneratedNotice, validateNoticePickIds} from './notices'
import {sanitizePickedIds} from '@/lib/select/notice-picks'
import type {ScoredHeadline} from '@/lib/select/select-winner'
import {resolveModel} from './claude'

async function claudeText(input: {
  system: string
  user: string
  maxTokens: number
  temperature: number
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY saknas')
  const anthropic = new Anthropic({apiKey})
  const message = await anthropic.messages.create({
    model: resolveModel(),
    max_tokens: input.maxTokens,
    temperature: input.temperature,
    system: input.system,
    messages: [{role: 'user', content: input.user}],
  })
  return message.content.map((block) => (block.type === 'text' ? block.text : '')).join('\n')
}

export async function pickNoticeHeadlineIds(
  pool: ScoredHeadline[],
  count: number,
): Promise<string[]> {
  const want = Math.min(count, pool.length)
  if (want <= 0) return []

  const tryOnce = async (): Promise<string[]> => {
    const text = await claudeText({
      system: NOTICE_PICK_SYSTEM,
      user: buildNoticePickUserPrompt(pool, want),
      maxTokens: 200,
      temperature: 0.2,
    })
    const ids = validateNoticePickIds(parseGeneratedAlarm(text))
    if (!ids) throw new Error('Claude-svaret saknade giltiga headlineIds')
    return sanitizePickedIds(ids, pool, want)
  }

  let picked: string[] = []
  try {
    picked = await tryOnce()
  } catch {
    picked = []
  }
  if (picked.length >= want) return picked
  try {
    const again = await tryOnce()
    return sanitizePickedIds([...picked, ...again], pool, want)
  } catch {
    return picked
  }
}

export async function generateNotice(source: {
  text: string
  newspaperName: string
}): Promise<{headline: string; body: string}> {
  const call = async () => {
    const text = await claudeText({
      system: NOTICE_WRITE_SYSTEM,
      user: buildNoticeWriteUserPrompt(source),
      maxTokens: 500,
      temperature: 0.9,
    })
    const generated = validateGeneratedNotice(parseGeneratedAlarm(text))
    if (!generated) throw new Error('Claude-svaret saknade notisrubrik eller brödtext')
    return generated
  }

  try {
    return await call()
  } catch {
    return await call()
  }
}
