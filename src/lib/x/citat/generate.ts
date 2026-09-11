import Anthropic from '@anthropic-ai/sdk'
import {resolveModel} from '@/lib/generate/claude'
import {parseGeneratedAlarm} from '@/lib/generate/parse'
import {
  CITAT_PROMPT_VERSION,
  CITAT_SPEECH_BUBBLE_SYSTEM,
  CITAT_WRITE_SYSTEM,
  buildCitatSpeechBubbleUserPrompt,
  buildCitatUserPrompt,
} from './prompt'
import {validateCitatSpeechBubble, validateGeneratedCitat, type GeneratedCitat} from './parse'

export async function generateCitat(source: {
  text: string
  username?: string | null
  dumhet?: number
  uppskruvning?: number
}): Promise<{generated: GeneratedCitat; modelVersion: string; promptVersion: string}> {
  const model = resolveModel()
  const anthropic = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY})
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY saknas')

  const call = async () => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      temperature: 0.9,
      system: CITAT_WRITE_SYSTEM,
      messages: [{role: 'user', content: buildCitatUserPrompt(source)}],
    })
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
    const generated = validateGeneratedCitat(parseGeneratedAlarm(text))
    if (!generated) throw new Error('Claude-svaret saknade citat-text')
    return generated
  }

  try {
    const generated = await call()
    return {generated, modelVersion: model, promptVersion: CITAT_PROMPT_VERSION}
  } catch {
    const generated = await call()
    return {generated, modelVersion: model, promptVersion: CITAT_PROMPT_VERSION}
  }
}

export async function generateCitatSpeechBubble(source: {text: string}): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY saknas')
  if (!source.text.trim()) throw new Error('Saknar citat-text')

  const model = resolveModel()
  const anthropic = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY})

  const call = async () => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 200,
      temperature: 0.9,
      system: CITAT_SPEECH_BUBBLE_SYSTEM,
      messages: [{role: 'user', content: buildCitatSpeechBubbleUserPrompt(source)}],
    })
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
    const generated = validateCitatSpeechBubble(parseGeneratedAlarm(text))
    if (!generated) throw new Error('Claude-svaret saknade pratbubbla')
    return generated
  }

  try {
    return await call()
  } catch {
    return await call()
  }
}
