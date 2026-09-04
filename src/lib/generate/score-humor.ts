import Anthropic from '@anthropic-ai/sdk'
import {validateHumorScore} from './humor-score'
import {parseGeneratedAlarm} from './parse'

export const HUMOR_SCORE_PROMPT_VERSION = 'humor-v1'

export type HumorPiece = {
  date: string
  kicker: string
  headline: string
  body: string
  humorScore?: number | null
}

const SYSTEM_PROMPT = `Du bedömer Kycklingbladet-nummer. Ge ett heltal humorScore 1–100 för hur träffsäker och rolig hönshusomskrivningen är.

Bedöm hantverket: vridningen, lexikonet, namnleken, tempot, om reportaget bär. Inte den verkliga händelsen. Skratta inte åt olyckan. Billig grymhet mot offer ger lågt. Torr nyhetsprosa utan skev humor ger lågt. Mörk händelse som blivit lustig i hönshuset utan att håna offret ger högt.

Kalibreringsnumren är ankare. Har de redan en poäng, håll samma skala. Har de ingen, använd dem bara som jämförelse.

Svara enbart med JSON: {"humorScore": 72}`

function clipBody(body: string): string {
  const trimmed = body.trim()
  if (trimmed.length <= 700) return trimmed
  return `${trimmed.slice(0, 700)}…`
}

function formatPiece(piece: HumorPiece, withScore: boolean): string {
  const score =
    withScore && typeof piece.humorScore === 'number' ? `\nhumorScore: ${piece.humorScore}` : ''
  return `${piece.date}\n${piece.kicker}\n${piece.headline}\n${clipBody(piece.body)}${score}`
}

export async function scoreHumor(input: {
  piece: HumorPiece
  sample: HumorPiece[]
}): Promise<number> {
  const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5-20250929'
  const anthropic = new Anthropic({apiKey: process.env.ANTHROPIC_API_KEY})
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY saknas')

  const sampleBlock =
    input.sample.length === 0
      ? 'Inga andra nummer att kalibrera mot ännu.'
      : input.sample.map((piece) => formatPiece(piece, true)).join('\n\n---\n\n')

  const user = `Andra nummer:\n\n${sampleBlock}\n\nBedöm detta nummer:\n\n${formatPiece(input.piece, false)}`

  const call = async () => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 80,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{role: 'user', content: user}],
    })
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
    const score = validateHumorScore(parseGeneratedAlarm(text))
    if (score == null) throw new Error('Claude-svaret saknade giltig humorScore')
    return score
  }

  try {
    return await call()
  } catch {
    return await call()
  }
}
