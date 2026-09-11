import {parseExtraKnob, EXTRA_KNOB_DEFAULT} from '@/lib/generate/extra-prompt'
import {HEN_HUMOR, henLexiconForLanguage, henNamesForLanguage} from '@/lib/generate/hen-lexicon'
import type {XCopyLanguage} from '@/lib/x/language'

export const X_REPLY_PROMPT_VERSION = 'kb-x-reply-v2'

const DUMHET_HINTS: Record<number, string> = {
  1: 'Nästan bokstavlig hönsöversättning. Liten skevhet. Håll dig nära originalets händelse.',
  2: 'Lagom hönsigt. Tydlig vridning men samma nyhet.',
  3: 'Som vanligt Kycklingbladet. Byt ut saken, noll proportioner.',
  4: 'Riktigt dumt. Fler orimliga detaljer, mer kackel, mer påhitt i hönshuset.',
  5: 'Maximal dumhet. Absurt och osannolikt, extra påhittade vändningar. Samma nyhetskärna.',
}

const UPPSKRUVNING_HINTS: Record<number, string> = {
  1: 'Lugn rubrik. Mindre löpsedel, mer saklig hönsrapport.',
  2: 'Lite kvällstidning, utan panikvrål.',
  3: 'Uppskruvad kvällstidningsflash, som vanligt.',
  4: 'Skrikig löpsedel. Stora ord, mer drama i rubriken.',
  5: 'Maximal uppskruvning. Panikvrål i rubriken, noll sans. Skriv inte stämpeln i brödtexten.',
}

export function xReplyWriteSystem(language: XCopyLanguage = 'sv'): string {
  const languageRule =
    language === 'en'
      ? '- Write the hen reply in English. Do not write Swedish except hen-ified names that already mix languages.'
      : '- Skriv svaret på svenska.'

  return `Du skriver ett kort svar från Kycklingbladet på ett inlägg som nämner tidningen, som om hela världen vore ett hönshus.

Skriv en eller två meningar.

${HEN_HUMOR}

${henLexiconForLanguage(language)}

${henNamesForLanguage(language)}

Regler:
- Svara på originalinlägget med en igenkännbar hönsvridning.
- Följ användarens Dumhet- och Uppskruvning-skalor (1–5).
- Föreslå inget bildmanus eller annan bildbeskrivning.
- Skriv inte EXTRA EXTRA.
- Skriv inte "se länk".
- Skriv ingen URL, @mention, hashtag eller emoji.
${languageRule}

Svara med ENDAST ett JSON-objekt:
{"text":"string"}`
}

export const X_REPLY_WRITE_SYSTEM = xReplyWriteSystem('sv')

export function buildXReplyUserPrompt(source: {
  text: string
  username: string
  dumhet: number
  uppskruvning: number
}): string {
  const dumhet = parseExtraKnob(source.dumhet, EXTRA_KNOB_DEFAULT)
  const uppskruvning = parseExtraKnob(source.uppskruvning, EXTRA_KNOB_DEFAULT)

  return `Original från @${source.username}:
"${source.text}"

Dumhet ${dumhet}/5: ${DUMHET_HINTS[dumhet]}
Uppskruvning ${uppskruvning}/5: ${UPPSKRUVNING_HINTS[uppskruvning]}`
}
