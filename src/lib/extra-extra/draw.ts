import {buildGeminiImagePrompt, type ExtraImageBrief} from '@/lib/generate/extra-image'
import {generateExtraJpeg} from './gemini'

export type ExtraPreviewImage = {mimeType: 'image/jpeg'; base64: string}
export type ExtraDrawResult = {image: ExtraPreviewImage | null; imageError: string | null}

export async function drawExtraImage(brief: ExtraImageBrief | null): Promise<ExtraDrawResult> {
  if (!brief) {
    return {image: null, imageError: null}
  }

  try {
    const buffer = await generateExtraJpeg(buildGeminiImagePrompt(brief))
    return {
      image: {mimeType: 'image/jpeg', base64: buffer.toString('base64')},
      imageError: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {image: null, imageError: message}
  }
}
