import Anthropic from '@anthropic-ai/sdk'
import {EXTRA_PROMPT_VERSION, EXTRA_WRITE_SYSTEM, buildExtraWriteUserPrompt} from './extra-prompt'
import {validateGeneratedExtra, type GeneratedExtra} from './extra'
import {parseGeneratedAlarm} from './parse'
import {resolveModel} from './claude'

export async function generateExtra(source: {
  text: string
  newspaperName: string
}): Promise<{generated: GeneratedExtra; modelVersion: string; promptVersion: string}> {
  const model = resolveModel()
  const anthropic = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY})
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY saknas')

  const call = async () => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      temperature: 0.9,
      system: EXTRA_WRITE_SYSTEM,
      messages: [{role: 'user', content: buildExtraWriteUserPrompt(source)}],
    })
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
    const generated = validateGeneratedExtra(parseGeneratedAlarm(text))
    if (!generated) throw new Error('Claude-svaret saknade EXTRA EXTRA-rubrik eller brödtext')
    return generated
  }

  try {
    const generated = await call()
    return {generated, modelVersion: model, promptVersion: EXTRA_PROMPT_VERSION}
  } catch {
    const generated = await call()
    return {generated, modelVersion: model, promptVersion: EXTRA_PROMPT_VERSION}
  }
}
