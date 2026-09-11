import Anthropic from '@anthropic-ai/sdk'
import {resolveModel} from '@/lib/generate/claude'
import {parseGeneratedAlarm} from '@/lib/generate/parse'
import {detectXCopyLanguage, type XCopyLanguage} from '@/lib/x/language'
import {X_REPLY_PROMPT_VERSION, buildXReplyUserPrompt, xReplyWriteSystem} from './prompt'
import {validateGeneratedXReply} from './parse'

export async function generateXReply(source: {
  text: string
  username: string
  dumhet: number
  uppskruvning: number
  language?: XCopyLanguage
}): Promise<{text: string; modelVersion: string; promptVersion: string}> {
  const model = resolveModel()
  const anthropic = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY})
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY saknas')
  const language = source.language ?? detectXCopyLanguage(source.text)

  const call = async () => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 400,
      temperature: 0.9,
      system: xReplyWriteSystem(language),
      messages: [{role: 'user', content: buildXReplyUserPrompt(source)}],
    })
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
    const generated = validateGeneratedXReply(parseGeneratedAlarm(text))
    if (!generated) throw new Error('Claude-svaret saknade svars-text')
    return generated
  }

  try {
    const text = await call()
    return {text, modelVersion: model, promptVersion: X_REPLY_PROMPT_VERSION}
  } catch {
    const text = await call()
    return {text, modelVersion: model, promptVersion: X_REPLY_PROMPT_VERSION}
  }
}
