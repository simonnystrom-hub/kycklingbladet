import Anthropic from '@anthropic-ai/sdk'
import { parseGeneratedAlarm } from './parse'
import { validateGeneratedAlarm, type GeneratedAlarm } from './validate'
import { buildUserPrompt, PROMPT_VERSION, SYSTEM_PROMPT } from './prompt'

export function resolveModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5-20250929'
}

export async function generateAlarm(source: {
  text: string
  newspaperName: string
}): Promise<{ generated: GeneratedAlarm; modelVersion: string; promptVersion: string }> {
  const model = resolveModel()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY saknas')

  const call = async () => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 2000,
      temperature: 0.9,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(source) }],
    })
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
    const parsed = parseGeneratedAlarm(text)
    const generated = validateGeneratedAlarm(parsed)
    if (!generated) throw new Error('Claude-svaret saknade kicker, rubrik, brödtext eller expertruta')
    return generated
  }

  try {
    const generated = await call()
    return { generated, modelVersion: model, promptVersion: PROMPT_VERSION }
  } catch (_first) {
    const generated = await call()
    return { generated, modelVersion: model, promptVersion: PROMPT_VERSION }
  }
}
