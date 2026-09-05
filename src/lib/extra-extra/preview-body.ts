import type {ExtraDrawResult} from './draw'
import type {ExtraExtraPreview} from './payload'

export function extraPreviewResponse(preview: ExtraExtraPreview, draw: ExtraDrawResult) {
  return {preview, image: draw.image, imageError: draw.imageError}
}
