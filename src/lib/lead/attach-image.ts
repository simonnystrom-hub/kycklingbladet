import {drawExtraImage, type ExtraPreviewImage} from '@/lib/extra-extra/draw'
import type {ExtraImageBrief} from '@/lib/generate/extra-image'
import {getWriteClient} from '@/lib/sanity/write-client'

export async function attachLeadImage(input: {
  id: string
  date: string
  brief: ExtraImageBrief | null
}): Promise<{image: ExtraPreviewImage | null; imageError: string | null}> {
  if (!input.brief) return {image: null, imageError: null}
  const draw = await drawExtraImage(input.brief)
  if (!draw.image) return {image: null, imageError: draw.imageError}
  const client = getWriteClient()
  const uploaded = await client.assets.upload(
    'image',
    Buffer.from(draw.image.base64, 'base64'),
    {filename: `lead-${input.date}.jpg`, contentType: draw.image.mimeType},
  )
  const id = input.id.replace(/^drafts\./, '')
  await client
    .patch(id)
    .set({
      image: {_type: 'image', asset: {_type: 'reference', _ref: uploaded._id}},
      imageCaption: input.brief.caption,
      imageShotType: input.brief.shotType,
      imagePrompt: input.brief.scenePrompt,
    })
    .commit()
  return {image: draw.image, imageError: null}
}
