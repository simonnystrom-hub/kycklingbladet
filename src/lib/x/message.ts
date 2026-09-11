import type {FacebookExtraCopy, FacebookLeadCopy} from '@/lib/facebook/message'
import {formatFacebookBody, stripLeadingExtraExtra} from '@/lib/facebook/style-text'
import {xHashtagLine} from './hashtags'

function joinBlocks(blocks: Array<string | null | undefined>): string {
  return blocks
    .map((block) => block?.trim() ?? '')
    .filter((block) => block.length > 0)
    .join('\n\n')
}

function captionBlock(caption?: string | null): string | null {
  const text = caption?.trim()
  if (!text) return null
  return `I bilden: ${text}`
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

export function xExpertBlock(input: {
  expertVoice?: string | null
  expertText?: string | null
}): string | null {
  const who = input.expertVoice?.trim()
  const said = input.expertText?.trim()
  if (!who || !said) return null
  return `${who}: ${quotedSpeech(said)}`
}

export function xLeadMessage(
  lead: FacebookLeadCopy,
  articleUrl?: string | null,
  hashtags?: unknown,
): string {
  return joinBlocks([
    lead.headline,
    formatFacebookBody(lead.body),
    xExpertBlock(lead),
    captionBlock(lead.imageCaption),
    xHashtagLine(hashtags),
    articleUrl,
  ])
}

export function xExtraMessage(
  extra: FacebookExtraCopy,
  articleUrl?: string | null,
  hashtags?: unknown,
): string {
  return joinBlocks([
    extra.headline,
    formatFacebookBody(stripLeadingExtraExtra(extra.body)),
    xExpertBlock(extra),
    captionBlock(extra.imageCaption),
    xHashtagLine(hashtags),
    articleUrl,
  ])
}
