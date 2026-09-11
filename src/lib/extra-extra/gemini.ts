import {GoogleGenAI} from '@google/genai'
import {envSecret} from '@/lib/env-secret'

const DEFAULT_MODEL = 'gemini-3-pro-image'
const MAX_ATTEMPTS = 3
const QUOTA_SLEEP_MS = 2_000

function getGeminiClient(): GoogleGenAI {
  const apiKey = envSecret(process.env.GEMINI_API_KEY)
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY saknas')
  }
  return new GoogleGenAI({apiKey})
}

function imageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isBillingDepleted(error: unknown): boolean {
  return /prepayment credits are depleted|credits are depleted/i.test(errorMessage(error))
}

function isRateLimitError(error: unknown): boolean {
  if (isBillingDepleted(error)) return false
  const message = errorMessage(error)
  return message.includes('429') || /quota|RESOURCE_EXHAUSTED/i.test(message)
}

function drawError(error: unknown): Error {
  const detail = errorMessage(error)
  console.error('Gemini-bildfel:', detail.slice(0, 400))
  if (isBillingDepleted(error)) {
    return new Error('Gemini-krediten är slut. Fyll på i Google AI Studio och rita igen.')
  }
  if (isRateLimitError(error)) {
    return new Error('Gemini-kvoten är slut just nu. Vänta en stund och rita igen.')
  }
  return new Error('Kunde inte rita bilden')
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateExtraJpeg(prompt: string): Promise<Buffer> {
  const ai = getGeminiClient()
  const model = imageModel()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const interaction = await ai.interactions.create({
        model,
        input: prompt,
        response_format: {
          type: 'image',
          mime_type: 'image/jpeg',
          aspect_ratio: '3:4',
          image_size: '1K',
        },
      })

      const image = interaction.output_image
      if (!image?.data) {
        throw new Error('Kunde inte rita bilden')
      }

      return Buffer.from(image.data, 'base64')
    } catch (error) {
      const isLastAttempt = attempt === MAX_ATTEMPTS
      if (!isLastAttempt && isRateLimitError(error)) {
        await sleep(QUOTA_SLEEP_MS * attempt)
        continue
      }
      throw drawError(error)
    }
  }

  throw new Error('Kunde inte rita bilden')
}
