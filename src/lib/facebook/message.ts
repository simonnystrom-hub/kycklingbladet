import {EXTRA_EXTRA_STAMP} from '@/lib/copy'

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

function expertBlock(lead: FacebookLeadCopy): string | null {
  const heading = `${lead.expertVoice} ${lead.expertHeadline}`.trim()
  return joinBlocks([heading, lead.expertText]) || null
}

function noticesBlock(notices?: FacebookNoticeCopy[] | null): string | null {
  if (!notices?.length) return null
  return joinBlocks([
    'Notiser',
    ...notices.map((notice) => joinBlocks([notice.headline, notice.body])),
  ])
}

export function facebookLeadMessage(lead: FacebookLeadCopy): string {
  return joinBlocks([
    lead.headline,
    lead.imageCaption,
    lead.body,
    expertBlock(lead),
    noticesBlock(lead.notices),
    FACEBOOK_LINK_HINT,
  ])
}

export function facebookExtraMessage(extra: FacebookExtraCopy): string {
  return joinBlocks([
    EXTRA_EXTRA_STAMP,
    extra.headline,
    extra.imageCaption,
    extra.body,
    FACEBOOK_LINK_HINT,
  ])
}
