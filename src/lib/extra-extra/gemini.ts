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

function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('429') || /quota/i.test(message)
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
      if (!isLastAttempt && isQuotaError(error)) {
        await sleep(QUOTA_SLEEP_MS * attempt)
        continue
      }
      throw new Error('Kunde inte rita bilden')
    }
  }

  throw new Error('Kunde inte rita bilden')
}
