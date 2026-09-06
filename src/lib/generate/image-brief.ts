import Anthropic from '@anthropic-ai/sdk'
import {HEN_LEXICON, HEN_NAMES} from './hen-lexicon'
import {validateExtraImageBrief, type ExtraImageBrief} from './extra-image'
import {parseGeneratedAlarm} from './parse'
import {resolveModel} from './claude'

export const IMAGE_BRIEF_SYSTEM = `Du skriver bildmanus till Kycklingbladet. Artikeln är redan skriven. Skriv INTE om rubrik eller brödtext.

${HEN_LEXICON}

${HEN_NAMES}

Regler:
- Bilden är en hönstidningsillustration: intervju, incident eller annat.
- imageCaption är svensk bildtext (vem/var/vad), inte en one-liner. Den ska stämma med artikeln. Bildtexten ska aldrig in i teckningen.
- imagePrompt är bara scenen, på engelska, för serierutan. Ingen skylttext, pratbubbla eller artistnamn i scenen.
- Bara höns och tuppar i scenen, inga människor.

Svara med ENDAST ett JSON-objekt:
{
  "imageShotType": "intervju" | "incident" | "annat",
  "imageCaption": "string",
  "imagePrompt": "string"
}`

export function buildImageBriefUserPrompt(input: {
  kind: 'larm' | 'extra' | 'visdomsord'
  headline: string
  body: string
}): string {
  const kind = input.kind === 'extra'
    ? 'EXTRA EXTRA'
    : input.kind === 'visdomsord'
      ? 'Visdomsord'
      : 'Larm'
  return `${kind}
Rubrik: ${input.headline}

${input.body}`
}

export async function generateImageBriefFromCopy(input: {
  kind: 'larm' | 'extra' | 'visdomsord'
  headline: string
  body: string
}): Promise<ExtraImageBrief> {
  const anthropic = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY})
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY saknas')
  const model = resolveModel()

  const call = async () => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 700,
      temperature: 0.7,
      system: IMAGE_BRIEF_SYSTEM,
      messages: [{role: 'user', content: buildImageBriefUserPrompt(input)}],
    })
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
    const brief = validateExtraImageBrief(parseGeneratedAlarm(text))
    if (!brief) throw new Error('Claude-svaret saknade bildmanus')
    return brief
  }

  try {
    return await call()
  } catch {
    return await call()
  }
}
