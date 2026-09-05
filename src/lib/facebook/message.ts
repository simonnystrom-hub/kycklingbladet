import {EXTRA_EXTRA_STAMP} from '@/lib/copy'
import {facebookBoldCaps, facebookItalic, formatFacebookBody, stripLeadingExtraExtra} from './style-text'

export const FACEBOOK_LINK_HINT = 'Se länk i kommentar'

export type FacebookNoticeCopy = {
  headline: string
  body: string
}

export type FacebookLeadCopy = {
  headline: string
  body: string
  expertVoice: string
  expertHeadline: string
  expertText: string
  imageCaption?: string | null
  notices?: FacebookNoticeCopy[] | null
}

export type FacebookExtraCopy = {
  headline: string
  body: string
  imageCaption?: string | null
}

function joinBlocks(blocks: Array<string | null | undefined>): string {
  return blocks
    .map((block) => block?.trim() ?? '')
    .filter((block) => block.length > 0)
    .join('\n\n')
}

function captionBlock(caption?: string | null): string | null {
  const text = caption?.trim()
  if (!text) return null
  return `I bilden: ${facebookItalic(text)}`
}

export function facebookLeadMessage(lead: FacebookLeadCopy): string {
  return joinBlocks([
    facebookBoldCaps(lead.headline),
    formatFacebookBody(lead.body),
    captionBlock(lead.imageCaption),
  ])
}

export function facebookExtraMessage(extra: FacebookExtraCopy): string {
  return joinBlocks([
    facebookBoldCaps(EXTRA_EXTRA_STAMP),
    facebookBoldCaps(extra.headline),
    formatFacebookBody(stripLeadingExtraExtra(extra.body)),
    captionBlock(extra.imageCaption),
  ])
}
