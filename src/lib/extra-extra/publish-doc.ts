import {EXTRA_KICKER} from '@/lib/generate/extra-prompt'
import type {ExtraExtraPreview} from './payload'

export type ExtraPublishAsset = {_id: string}

export function extraCreateDocument(input: {
  id: string
  date: string
  preview: ExtraExtraPreview
  asset: ExtraPublishAsset | null
  createdAt: string
}): Record<string, unknown> & {_type: 'extraExtra'} {
  const {id, date, preview, asset, createdAt} = input

  const doc: Record<string, unknown> & {_type: 'extraExtra'} = {
    _id: id,
    _type: 'extraExtra',
    date,
    kicker: EXTRA_KICKER,
    headline: preview.headline,
    body: preview.body,
    sourceUrl: preview.sourceUrl,
    sourceHeadline: preview.sourceHeadline,
    sourceNewspaper: preview.sourceNewspaper,
    sourceNewspaperSlug: preview.sourceNewspaperSlug,
    promptVersion: preview.promptVersion,
    modelVersion: preview.modelVersion,
    createdAt,
  }

  if (
    asset &&
    preview.imageCaption &&
    preview.imageShotType &&
    preview.imagePrompt
  ) {
    doc.image = {
      _type: 'image',
      asset: {_type: 'reference', _ref: asset._id},
    }
    doc.imageCaption = preview.imageCaption
    doc.imageShotType = preview.imageShotType
    doc.imagePrompt = preview.imagePrompt
  }

  return doc
}
