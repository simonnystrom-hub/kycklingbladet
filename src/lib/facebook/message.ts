import {EXTRA_EXTRA_STAMP} from '@/lib/copy'
import {
  facebookBold,
  facebookBoldCaps,
  facebookItalic,
  formatFacebookBody,
  stripLeadingExtraExtra,
} from './style-text'

export const FACEBOOK_LINK_HINT = 'Se länk i kommentar'

export type FacebookNoticeCopy = {
  headline: string
  body: string
}

export type FacebookExpertCopy = {
  expertVoice?: string | null
  expertText?: string | null
}

export type FacebookLeadCopy = FacebookExpertCopy & {
  headline: string
  body: string
  expertHeadline?: string | null
  imageCaption?: string | null
  notices?: FacebookNoticeCopy[] | null
}

export type FacebookExtraCopy = FacebookExpertCopy & {
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
  return facebookItalic(`I bilden: ${text}`)
}

function quotedSpeech(text: string): string {
  const trimmed = text.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('“') && trimmed.endsWith('”')) ||
    (trimmed.startsWith('«') && trimmed.endsWith('»'))
  ) {
    return trimmed
  }
  return `"${trimmed}"`
}

export function facebookExpertBlock(input: FacebookExpertCopy): string | null {
  const who = input.expertVoice?.trim()
  const said = input.expertText?.trim()
  if (!who || !said) return null
  return `${facebookBold(who)}: ${quotedSpeech(said)}`
}

export function facebookLeadMessage(lead: FacebookLeadCopy): string {
  return joinBlocks([
    facebookBoldCaps(lead.headline),
    formatFacebookBody(lead.body),
    facebookExpertBlock(lead),
    captionBlock(lead.imageCaption),
  ])
}

export function facebookExtraMessage(extra: FacebookExtraCopy): string {
  return joinBlocks([
    facebookBoldCaps(EXTRA_EXTRA_STAMP),
    facebookBoldCaps(extra.headline),
    formatFacebookBody(stripLeadingExtraExtra(extra.body)),
    facebookExpertBlock(extra),
    captionBlock(extra.imageCaption),
  ])
}
